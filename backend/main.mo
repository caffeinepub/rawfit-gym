import Map "mo:core/Map";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let actorVersion = "v1.2.3.0";
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public type LocationCoordinates = {
    latitude : Float;
    longitude : Float;
  };

  public type UserProfile = {
    memberId : ?Text;
    name : Text;
    email : Text;
  };

  public type MemberProfile = {
    id : Text;
    name : Text;
    contactInfo : Text;
    membershipStart : Time.Time;
    membershipEnd : Time.Time;
    packageId : Text;
    assignedDietId : ?Text;
    assignedWorkoutId : ?Text;
    status : MembershipStatus;
    discountAmount : Nat;
    finalPayableAmount : Nat;
  };

  public type DietChart = {
    id : Text;
    name : Text;
    description : Text;
    meals : [Meal];
  };

  public type Meal = {
    name : Text;
    description : Text;
    calories : Nat;
    protein : Nat;
    carbs : Nat;
    fats : Nat;
  };

  public type WorkoutChart = {
    id : Text;
    name : Text;
    description : Text;
    exercises : [Exercise];
  };

  public type Exercise = {
    name : Text;
    sets : Nat;
    reps : Nat;
    instructions : Text;
  };

  public type MembershipPackage = {
    id : Text;
    packageType : Text;
    durationInMonths : Nat;
    priceInRupees : Nat;
  };

  public type AttendanceRecord = {
    memberId : Text;
    checkInTime : Time.Time;
    checkOutTime : ?Time.Time;
    status : Text;
    method : AttendanceMethod;
  };

  public type AttendanceMethod = {
    #qrScan;
    #manualEntry;
    #autoCheckout;
  };

  public type VideoMetadata = {
    id : Text;
    title : Text;
    category : Text;
    description : Text;
    blob : Storage.ExternalBlob;
    associatedWorkoutId : ?Text;
  };

  public type CreateMemberResult = {
    #success;
    #missingField : {
      fieldName : Text;
    };
    #duplicateContactInfo;
    #notFound : {
      entity : Text;
      id : Text;
    };
    #agentError : Text;
  };

  public type MembershipStatus = {
    #active;
    #inactive;
    #paused;
  };

  public type PauseRequestStatus = {
    #pending;
    #approved;
    #denied;
    #expired;
  };

  public type PauseRequest = {
    id : Text;
    memberId : Text;
    requestedAt : Time.Time;
    status : PauseRequestStatus;
    processedAt : ?Time.Time;
    adminMessage : ?Text;
  };

  let members = Map.empty<Text, MemberProfile>();
  let diets = Map.empty<Text, DietChart>();
  let workouts = Map.empty<Text, WorkoutChart>();
  let packages = Map.empty<Text, MembershipPackage>();
  let attendance = Map.empty<Text, List.List<AttendanceRecord>>();
  let videos = Map.empty<Text, VideoMetadata>();
  var userProfiles = Map.empty<Principal, UserProfile>();
  var pauseRequests = Map.empty<Text, PauseRequest>();

  let gymLocation : LocationCoordinates = {
    latitude = 23.5584;
    longitude = 87.2927;
  };

  var authorizedRadiusMeters = 100;
  var idCounter = 0;

  let autoCheckoutTimeout : Time.Time = 4 * 60 * 60 * 1_000_000_000;

  let pauseRequestExpiryPeriod : Time.Time = 3 * 24 * 60 * 60 * 1_000_000_000;

  func isMembershipActive(memberId : Text) : Bool {
    let memberOpt = members.get(memberId);
    switch (memberOpt) {
      case (null) { false };
      case (?member) {
        switch (member.status) {
          case (#active) {
            let now = Time.now();
            now >= member.membershipStart and now <= member.membershipEnd;
          };
          case (#inactive) { false };
          case (#paused) { false };
        };
      };
    };
  };

  func isMembershipValid(memberId : Text) : Bool {
    let memberOpt = members.get(memberId);

    switch (memberOpt) {
      case (null) { false };
      case (?member) {
        let now = Time.now();
        switch (member.status) {
          case (#active) {
            now >= member.membershipStart and now <= member.membershipEnd;
          };
          case (#paused) {
            now >= member.membershipStart and now <= member.membershipEnd;
          };
          case (#inactive) { false };
        };
      };
    };
  };

  func isTextEmpty(text : Text) : Bool {
    text.size() == 0;
  };

  func findMemberProfile(id : Text) : MemberProfile {
    switch (members.get(id)) {
      case (null) { Runtime.trap("Member not found") };
      case (?profile) { profile };
    };
  };

  func findDietChart(id : Text) : DietChart {
    switch (diets.get(id)) {
      case (null) { Runtime.trap("Diet not found") };
      case (?diet) { diet };
    };
  };

  func findWorkoutChart(id : Text) : WorkoutChart {
    switch (workouts.get(id)) {
      case (null) { Runtime.trap("Workout not found") };
      case (?workout) { workout };
    };
  };

  func validateMemberInput(profile : MemberProfile) : ?{
    missingField : {
      fieldName : Text;
    };
    duplicateContactInfo : Bool;
    notFound : {
      entity : Text;
      id : Text;
    };
  } {
    if (isTextEmpty(profile.name)) {
      return ?{
        missingField = { fieldName = "name" };
        duplicateContactInfo = false;
        notFound = { entity = ""; id = "" };
      };
    };
    if (isTextEmpty(profile.contactInfo)) {
      return ?{
        missingField = { fieldName = "contactInfo" };
        duplicateContactInfo = false;
        notFound = { entity = ""; id = "" };
      };
    };
    if (isTextEmpty(profile.packageId)) {
      return ?{
        missingField = { fieldName = "packageId" };
        duplicateContactInfo = false;
        notFound = { entity = ""; id = "" };
      };
    };
    if (profile.membershipStart == 0) {
      return ?{
        missingField = { fieldName = "membershipStart" };
        duplicateContactInfo = false;
        notFound = { entity = ""; id = "" };
      };
    };

    if (profile.membershipEnd == 0) {
      return ?{
        missingField = { fieldName = "membershipEnd" };
        duplicateContactInfo = false;
        notFound = { entity = ""; id = "" };
      };
    };

    let contactInfoTaken = members.values().any(
      func(member) {
        member.contactInfo == profile.contactInfo;
      }
    );
    if (contactInfoTaken) {
      return ?{
        missingField = { fieldName = "" };
        duplicateContactInfo = true;
        notFound = { entity = ""; id = "" };
      };
    };

    if (not packages.containsKey(profile.packageId)) {
      return ?{
        missingField = { fieldName = "" };
        duplicateContactInfo = false;
        notFound = { entity = "package"; id = profile.packageId };
      };
    };

    switch (profile.assignedDietId) {
      case (null) {};
      case (?dietId) {
        if (not diets.containsKey(dietId)) {
          return ?{
            missingField = { fieldName = "" };
            duplicateContactInfo = false;
            notFound = { entity = "diet"; id = dietId };
          };
        };
      };
    };

    switch (profile.assignedWorkoutId) {
      case (null) {};
      case (?workoutId) {
        if (not workouts.containsKey(workoutId)) {
          return ?{
            missingField = { fieldName = "" };
            duplicateContactInfo = false;
            notFound = { entity = "workout"; id = workoutId };
          };
        };
      };
    };

    null;
  };

  func getCurrentAttendanceStatus(memberId : Text) : ?AttendanceRecord {
    let records = attendance.get(memberId);
    switch (records) {
      case (null) { null };
      case (?recordsList) {
        let recordsArray = recordsList.toArray();
        if (recordsArray.size() == 0) {
          return null;
        };
        let lastRecord = recordsArray[recordsArray.size() - 1];
        switch (lastRecord.checkOutTime) {
          case (null) { ?lastRecord };
          case (?_) { null };
        };
      };
    };
  };

  func isAuthorizedForMember(caller : Principal, memberId : Text) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) { return true };

    let profileOpt = userProfiles.get(caller);
    switch (profileOpt) {
      case (null) { false };
      case (?profile) {
        switch (profile.memberId) {
          case (null) { false };
          case (?id) { id == memberId };
        };
      };
    };
  };

  func checkAndExpireRequest(request : PauseRequest) : PauseRequest {
    if (request.status == #pending) {
      let now = Time.now();
      let timeSinceRequest = now - request.requestedAt;

      if (timeSinceRequest >= pauseRequestExpiryPeriod) {
        let expiredRequest : PauseRequest = {
          request with
          status = #expired;
          processedAt = ?now;
          adminMessage = switch (request.adminMessage) {
            case (null) { ?"Auto-rejected due to no admin action within 3 days" };
            case (?msg) { ?msg };
          };
        };
        pauseRequests.add(request.id, expiredRequest);
        return expiredRequest;
      };
    };

    request;
  };

  func processExpiredRequests() {
    let now = Time.now();

    for ((requestId, request) in pauseRequests.entries()) {
      if (request.status == #pending) {
        let timeSinceRequest = now - request.requestedAt;

        if (timeSinceRequest >= pauseRequestExpiryPeriod) {
          let expiredRequest : PauseRequest = {
            request with
            status = #expired;
            processedAt = ?now;
            adminMessage = switch (request.adminMessage) {
              case (null) { ?"Auto-rejected due to no admin action within 3 days" };
              case (?msg) { ?msg };
            };
          };
          pauseRequests.add(requestId, expiredRequest);
        };
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func createMember(profile : MemberProfile) : async CreateMemberResult {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return #agentError("Unauthorized: Admins only");
    };

    switch (validateMemberInput(profile)) {
      case (null) {};
      case (?{ missingField }) { return #missingField(missingField) };
    };

    members.add(profile.id, profile);
    #success;
  };

  public shared ({ caller }) func updateMember(profile : MemberProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Admins only");
    };

    members.add(profile.id, profile);
  };

  public shared ({ caller }) func createDietChart(diet : DietChart) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Admins only");
    };

    diets.add(diet.id, diet);
  };

  public shared ({ caller }) func updateDietChart(diet : DietChart) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Admins only");
    };

    diets.add(diet.id, diet);
  };

  public shared ({ caller }) func createWorkoutChart(workout : WorkoutChart) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Admins only");
    };

    workouts.add(workout.id, workout);
  };

  public shared ({ caller }) func updateWorkoutChart(workout : WorkoutChart) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Admins only");
    };

    workouts.add(workout.id, workout);
  };

  public shared ({ caller }) func createMembershipPackage(pkg : MembershipPackage) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Admins only");
    };

    packages.add(pkg.id, pkg);
  };

  public shared ({ caller }) func updateMembershipPackage(pkg : MembershipPackage) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Admins only");
    };

    packages.add(pkg.id, pkg);
  };

  public shared ({ caller }) func deleteMembershipPackage(packageId : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Admins only");
    };

    if (not packages.containsKey(packageId)) {
      Runtime.trap("Package not found");
    };

    packages.remove(packageId);
  };

  public shared ({ caller }) func recordAttendance(record : AttendanceRecord) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Admins only");
    };

    if (not members.containsKey(record.memberId)) {
      Runtime.trap("Member not found");
    };

    let existing = attendance.get(record.memberId);
    switch (existing) {
      case (null) {
        let newList = List.empty<AttendanceRecord>();
        newList.add(record);
        attendance.add(record.memberId, newList);
      };
      case (?records) {
        records.add(record);
      };
    };
  };

  public shared ({ caller }) func recordQRAttendance(memberId : Text, isCheckIn : Bool) : async () {
    if (not members.containsKey(memberId)) {
      Runtime.trap("Member not found");
    };

    if (not isMembershipActive(memberId)) {
      Runtime.trap("Membership is not active");
    };

    if (not isAuthorizedForMember(caller, memberId)) {
      Runtime.trap("Unauthorized: Can only record attendance for yourself or as admin");
    };

    let now = Time.now();
    let currentStatus = getCurrentAttendanceStatus(memberId);

    if (isCheckIn) {
      switch (currentStatus) {
        case (?_) {
          Runtime.trap("Already checked in");
        };
        case (null) {
          let newRecord : AttendanceRecord = {
            memberId = memberId;
            checkInTime = now;
            checkOutTime = null;
            status = "checked_in";
            method = #qrScan;
          };

          let existing = attendance.get(memberId);
          switch (existing) {
            case (null) {
              let newList = List.empty<AttendanceRecord>();
              newList.add(newRecord);
              attendance.add(memberId, newList);
            };
            case (?records) {
              records.add(newRecord);
            };
          };
        };
      };
    } else {
      switch (currentStatus) {
        case (null) {
          Runtime.trap("Not checked in");
        };
        case (?currentRecord) {
          let updatedRecord : AttendanceRecord = {
            memberId = currentRecord.memberId;
            checkInTime = currentRecord.checkInTime;
            checkOutTime = ?now;
            status = "checked_out";
            method = currentRecord.method;
          };

          let existing = attendance.get(memberId);
          switch (existing) {
            case (null) {
              Runtime.trap("Attendance record not found");
            };
            case (?records) {
              let recordsArray = records.toArray();
              if (recordsArray.size() == 0) {
                Runtime.trap("Attendance record not found");
              };

              let newList = List.empty<AttendanceRecord>();
              var index = 0;
              while (index + 1 < recordsArray.size()) {
                newList.add(recordsArray[index]);
                index += 1;
              };

              newList.add(updatedRecord);
              attendance.add(memberId, newList);
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func processAutoCheckout(memberId : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Admins only");
    };

    if (not members.containsKey(memberId)) {
      Runtime.trap("Member not found");
    };

    let currentStatus = getCurrentAttendanceStatus(memberId);

    switch (currentStatus) {
      case (null) {};
      case (?currentRecord) {
        let now = Time.now();
        let timeSinceCheckIn = now - currentRecord.checkInTime;

        if (timeSinceCheckIn >= autoCheckoutTimeout) {
          let autoCheckoutTime = currentRecord.checkInTime + autoCheckoutTimeout;
          let updatedRecord : AttendanceRecord = {
            memberId = currentRecord.memberId;
            checkInTime = currentRecord.checkInTime;
            checkOutTime = ?autoCheckoutTime;
            status = "auto_checked_out";
            method = #autoCheckout;
          };

          let existing = attendance.get(memberId);
          switch (existing) {
            case (null) {};
            case (?records) {
              let recordsArray = records.toArray();
              if (recordsArray.size() > 0) {
                let newList = List.empty<AttendanceRecord>();
                var index = 0;
                while (index + 1 < recordsArray.size()) {
                  newList.add(recordsArray[index]);
                  index += 1;
                };

                newList.add(updatedRecord);
                attendance.add(memberId, newList);
              };
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func getCurrentCheckInStatus(memberId : Text) : async ?{
    isCheckedIn : Bool;
    checkInTime : ?Time.Time;
    method : ?AttendanceMethod;
  } {
    if (not members.containsKey(memberId)) {
      Runtime.trap("Member not found");
    };

    if (not isMembershipValid(memberId)) {
      Runtime.trap("Membership is not valid");
    };

    if (not isAuthorizedForMember(caller, memberId)) {
      Runtime.trap("Unauthorized: Can only view your own check-in status or as admin");
    };

    let currentStatus = getCurrentAttendanceStatus(memberId);
    switch (currentStatus) {
      case (null) {
        ?{
          isCheckedIn = false;
          checkInTime = null;
          method = null;
        };
      };
      case (?record) {
        ?{
          isCheckedIn = true;
          checkInTime = ?record.checkInTime;
          method = ?record.method;
        };
      };
    };
  };

  public shared ({ caller }) func addVideo(metadata : VideoMetadata) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Admins only");
    };

    videos.add(metadata.id, metadata);
  };

  public shared ({ caller }) func deleteVideo(videoId : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Admins only");
    };

    videos.remove(videoId);
  };

  public query ({ caller }) func getMemberProfile(memberId : Text) : async MemberProfile {
    if (not members.containsKey(memberId)) {
      Runtime.trap("Member not found");
    };

    if (not isMembershipValid(memberId)) {
      Runtime.trap("Membership is not valid");
    };

    if (not isAuthorizedForMember(caller, memberId)) {
      Runtime.trap("Unauthorized: Can only view your own profile or as admin");
    };

    findMemberProfile(memberId);
  };

  public query ({ caller }) func getAssignedDiet(memberId : Text) : async DietChart {
    if (not members.containsKey(memberId)) {
      Runtime.trap("Member not found");
    };

    if (not isMembershipValid(memberId)) {
      Runtime.trap("Membership is not valid");
    };

    if (not isAuthorizedForMember(caller, memberId)) {
      Runtime.trap("Unauthorized: Can only view your own diet or as admin");
    };

    let profile = findMemberProfile(memberId);
    switch (profile.assignedDietId) {
      case (null) { Runtime.trap("No diet assigned") };
      case (?dietId) { findDietChart(dietId) };
    };
  };

  public query ({ caller }) func getAssignedWorkout(memberId : Text) : async WorkoutChart {
    if (not members.containsKey(memberId)) {
      Runtime.trap("Member not found");
    };

    if (not isMembershipValid(memberId)) {
      Runtime.trap("Membership is not valid");
    };

    if (not isAuthorizedForMember(caller, memberId)) {
      Runtime.trap("Unauthorized: Can only view your own workout or as admin");
    };

    let profile = findMemberProfile(memberId);
    switch (profile.assignedWorkoutId) {
      case (null) { Runtime.trap("No workout assigned") };
      case (?workoutId) { findWorkoutChart(workoutId) };
    };
  };

  public query ({ caller }) func getAttendanceHistory(memberId : Text) : async [AttendanceRecord] {
    if (not members.containsKey(memberId)) {
      Runtime.trap("Member not found");
    };

    if (not isMembershipValid(memberId)) {
      Runtime.trap("Membership is not valid");
    };

    if (not isAuthorizedForMember(caller, memberId)) {
      Runtime.trap("Unauthorized: Can only view your own attendance history or as admin");
    };

    let records = attendance.get(memberId);
    switch (records) {
      case (null) { [] };
      case (?records) { records.toArray() };
    };
  };

  public query ({ caller }) func getVideoLibrary(memberId : Text) : async [VideoMetadata] {
    if (not members.containsKey(memberId)) {
      Runtime.trap("Member not found");
    };

    if (not isMembershipValid(memberId)) {
      Runtime.trap("Membership is not valid");
    };

    if (not isAuthorizedForMember(caller, memberId)) {
      Runtime.trap("Unauthorized: Can only view your own video library or as admin");
    };

    let memberProfile = findMemberProfile(memberId);
    switch (memberProfile.assignedWorkoutId) {
      case (null) { [] };
      case (?workoutId) {
        let allVideos = videos.values().toArray();
        allVideos.filter<VideoMetadata>(
          func(video) {
            switch (video.associatedWorkoutId) {
              case (null) { false };
              case (?videoWorkoutId) { videoWorkoutId == workoutId };
            };
          }
        );
      };
    };
  };

  public query ({ caller }) func getAllMembers() : async [MemberProfile] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Admins only");
    };

    members.values().toArray();
  };

  public query ({ caller }) func getAllDietCharts() : async [DietChart] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Admins only");
    };

    diets.values().toArray();
  };

  public query ({ caller }) func getAllWorkoutCharts() : async [WorkoutChart] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Admins only");
    };

    workouts.values().toArray();
  };

  public query ({ caller }) func getAllMembershipPackages() : async [MembershipPackage] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Admins only");
    };

    packages.values().toArray();
  };

  public shared ({ caller }) func initiatePauseRequest(memberId : Text) : async () {
    if (not members.containsKey(memberId)) {
      Runtime.trap("Member not found");
    };

    if (not isAuthorizedForMember(caller, memberId)) {
      Runtime.trap("Unauthorized: Can only initiate pause request for your own membership");
    };

    let member = findMemberProfile(memberId);
    switch (member.status) {
      case (#active) {
        let requestId = generateUniqueId();
        let newRequest : PauseRequest = {
          id = requestId;
          memberId;
          requestedAt = Time.now();
          status = #pending;
          processedAt = null;
          adminMessage = null;
        };
        pauseRequests.add(requestId, newRequest);
      };
      case (#paused) {
        Runtime.trap("Membership is already paused");
      };
      case (#inactive) {
        Runtime.trap("Cannot pause inactive membership");
      };
    };
  };

  public query ({ caller }) func getPauseRequestStatus(memberId : Text) : async ?{
    requestId : Text;
    status : PauseRequestStatus;
    adminMessage : ?Text;
  } {
    if (not members.containsKey(memberId)) {
      Runtime.trap("Member not found");
    };

    if (not isAuthorizedForMember(caller, memberId)) {
      Runtime.trap("Unauthorized: Can only view your own pause request status");
    };

    var latestRequestId : ?Text = null;
    var latestRequest : ?PauseRequest = null;
    let currentTime = Time.now();

    for ((_, request) in pauseRequests.entries()) {
      if (request.memberId == memberId) {
        let processedRequest = checkAndExpireRequest(request);
        switch (latestRequest) {
          case (null) {
            latestRequestId := ?processedRequest.id;
            latestRequest := ?processedRequest;
          };
          case (?existing) {
            let existingTimeDiff = currentTime - existing.requestedAt;
            let newTimeDiff = currentTime - processedRequest.requestedAt;
            if (newTimeDiff < existingTimeDiff) {
              latestRequestId := ?processedRequest.id;
              latestRequest := ?processedRequest;
            };
          };
        };
      };
    };

    switch (latestRequest) {
      case (null) { null };
      case (?request) {
        ?{
          requestId = request.id;
          status = request.status;
          adminMessage = request.adminMessage;
        };
      };
    };
  };

  public query ({ caller }) func hasPendingPauseRequest(memberId : Text) : async Bool {
    if (not members.containsKey(memberId)) {
      Runtime.trap("Member not found");
    };

    if (not isAuthorizedForMember(caller, memberId)) {
      Runtime.trap("Unauthorized: Can only check your own pending pause requests");
    };

    let now = Time.now();

    var hasPending = false;
    for ((_, request) in pauseRequests.entries()) {
      if (request.memberId == memberId and request.status == #pending) {
        let timeSinceRequest = now - request.requestedAt;
        if (timeSinceRequest < pauseRequestExpiryPeriod) {
          hasPending := true;
        };
      };
    };

    hasPending;
  };

  public shared ({ caller }) func approvePauseRequest(requestId : Text, adminMessage : ?Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Admins only");
    };

    let requestOpt = pauseRequests.get(requestId);
    switch (requestOpt) {
      case (null) { Runtime.trap("Pause request not found") };
      case (?request) {
        let currentRequest = checkAndExpireRequest(request);
        if (currentRequest.status == #pending) {
          let updatedRequest : PauseRequest = { currentRequest with status = #approved; processedAt = ?Time.now(); adminMessage };
          pauseRequests.add(requestId, updatedRequest);

          let memberOpt = members.get(currentRequest.memberId);
          switch (memberOpt) {
            case (null) {};
            case (?member) {
              let updatedMember = { member with status = #paused };
              members.add(currentRequest.memberId, updatedMember);
            };
          };
        } else {
          Runtime.trap("Cannot approve non-pending request");
        };
      };
    };
  };

  public shared ({ caller }) func denyPauseRequest(requestId : Text, adminMessage : ?Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Admins only");
    };

    let requestOpt = pauseRequests.get(requestId);
    switch (requestOpt) {
      case (null) { Runtime.trap("Pause request not found") };
      case (?request) {
        let currentRequest = checkAndExpireRequest(request);
        if (currentRequest.status == #pending) {
          let updatedRequest : PauseRequest = { currentRequest with status = #denied; processedAt = ?Time.now(); adminMessage };
          pauseRequests.add(requestId, updatedRequest);
        } else {
          Runtime.trap("Cannot deny non-pending request");
        };
      };
    };
  };

  public query ({ caller }) func getAllPauseRequests() : async [PauseRequest] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Admins only");
    };

    processExpiredRequests();

    let requests = pauseRequests.values().toArray();
    let sortedRequests = requests.sort(
      func(a, b) {
        if (a.requestedAt > b.requestedAt) {
          #greater;
        } else if (a.requestedAt < b.requestedAt) {
          #less;
        } else {
          #equal;
        };
      }
    );

    sortedRequests;
  };

  public shared ({ caller }) func resumeMembership(memberId : Text) : async () {
    if (not members.containsKey(memberId)) {
      Runtime.trap("Member not found");
    };

    if (not isAuthorizedForMember(caller, memberId)) {
      Runtime.trap("Unauthorized: Can only resume your own membership");
    };

    let member = findMemberProfile(memberId);
    switch (member.status) {
      case (#paused) {
        let updatedMember = { member with status = #active };
        members.add(memberId, updatedMember);
      };
      case (#active) {
        Runtime.trap("Membership is already active");
      };
      case (#inactive) {
        Runtime.trap("Cannot resume inactive membership");
      };
    };
  };

  // Login-related functions: these use the membership ID as the credential.
  // Any caller (including anonymous/guest) may attempt to validate a membership ID.
  // The membership ID itself is the secret that grants access, so no caller-identity
  // check is applied here. Post-login, the frontend stores the memberId in the user
  // profile and subsequent calls use isAuthorizedForMember.

  public query func validateMemberLogin(memberId : Text) : async {
    isValid : Bool;
  } {
    let memberOpt = members.get(memberId);

    switch (memberOpt) {
      case (null) {
        { isValid = false };
      };
      case (?member) {
        let now = Time.now();
        let isValid = switch (member.status) {
          case (#active) {
            now >= member.membershipStart and now <= member.membershipEnd
          };
          case (#inactive) { false };
          case (#paused) {
            now >= member.membershipStart and now <= member.membershipEnd
          };
        };
        { isValid };
      };
    };
  };

  public query func getMemberByMembershipId(memberId : Text) : async {
    isValid : Bool;
    status : MembershipStatus;
    member : ?MemberProfile;
  } {
    let memberOpt = members.get(memberId);

    switch (memberOpt) {
      case (null) {
        { isValid = false; status = #inactive; member = null };
      };
      case (?member) {
        let now = Time.now();
        let isValid = switch (member.status) {
          case (#active) {
            now >= member.membershipStart and now <= member.membershipEnd
          };
          case (#inactive) { false };
          case (#paused) {
            now >= member.membershipStart and now <= member.membershipEnd
          };
        };
        { isValid; status = member.status; member = memberOpt };
      };
    };
  };

  public query func memberLogin(membershipId : Text) : async {
    isValid : Bool;
    status : MembershipStatus;
    name : Text;
  } {
    let memberOpt = members.get(membershipId);

    switch (memberOpt) {
      case (null) {
        { isValid = false; status = #inactive; name = "" };
      };
      case (?member) {
        let now = Time.now();
        let isValid = switch (member.status) {
          case (#active) {
            now >= member.membershipStart and now <= member.membershipEnd
          };
          case (#paused) {
            now >= member.membershipStart and now <= member.membershipEnd
          };
          case (#inactive) { false };
        };
        {
          isValid;
          status = member.status;
          name = member.name;
        };
      };
    };
  };

  func generateUniqueId() : Text {
    idCounter += 1;
    idCounter.toText();
  };

  public shared ({ caller }) func updateGymLocation(location : LocationCoordinates, radius : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Admins only");
    };
    authorizedRadiusMeters := radius;
  };

  public query func getGymLocation() : async {
    location : LocationCoordinates;
    radius : Nat;
  } {
    {
      location = gymLocation;
      radius = authorizedRadiusMeters;
    };
  };

  public query ({ caller }) func getMemberByContactInfo(contactInfo : Text) : async ?MemberProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Admins only");
    };

    let filtered = members.filter(
      func(_id, profile) {
        profile.contactInfo == contactInfo;
      }
    );

    switch (filtered.size()) {
      case (0) { null };
      case (_) {
        let firstEntry = filtered.entries().next();
        switch (firstEntry) {
          case (null) { null };
          case (?entry) { ?entry.1 };
        };
      };
    };
  };

  public query func healthCheck() : async {
    ok : Bool;
    timestamp : Time.Time;
    version : Text;
  } {
    {
      ok = true;
      timestamp = Time.now();
      version = actorVersion;
    };
  };
};

