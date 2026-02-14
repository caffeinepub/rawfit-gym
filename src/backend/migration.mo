import Map "mo:core/Map";
import Text "mo:core/Text";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

import Storage "blob-storage/Storage";

module {
  type LocationCoordinates = {
    latitude : Float;
    longitude : Float;
  };

  type UserProfile = {
    memberId : ?Text;
    name : Text;
    email : Text;
  };

  type MemberProfile = {
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

  type DietChart = {
    id : Text;
    name : Text;
    description : Text;
    meals : [Meal];
  };

  type Meal = {
    name : Text;
    description : Text;
    calories : Nat;
    protein : Nat;
    carbs : Nat;
    fats : Nat;
  };

  type WorkoutChart = {
    id : Text;
    name : Text;
    description : Text;
    exercises : [Exercise];
  };

  type Exercise = {
    name : Text;
    sets : Nat;
    reps : Nat;
    instructions : Text;
  };

  type MembershipPackage = {
    id : Text;
    packageType : Text;
    durationInMonths : Nat;
    priceInRupees : Nat; // INR field
  };

  type AttendanceRecord = {
    memberId : Text;
    checkInTime : Time.Time;
    checkOutTime : ?Time.Time;
    status : Text;
    method : AttendanceMethod; // QR scan or manual entry
  };

  type AttendanceMethod = {
    #qrScan;
    #manualEntry;
    #autoCheckout;
  };

  type VideoMetadata = {
    id : Text;
    title : Text;
    category : Text;
    description : Text;
    blob : Storage.ExternalBlob;
    associatedWorkoutId : ?Text;
  };

  type MembershipStatus = {
    #active;
    #inactive;
    #paused;
  };

  type PauseRequestStatus = {
    #pending;
    #approved;
    #denied;
  };

  type OldPauseRequest = {
    id : Text;
    memberId : Text;
    requestedAt : Time.Time;
    status : PauseRequestStatus;
    processedAt : ?Time.Time;
    adminMessage : ?Text;
  };

  type NewPauseRequestStatus = {
    #pending;
    #approved;
    #denied;
    #expired;
  };

  type NewPauseRequest = {
    id : Text;
    memberId : Text;
    requestedAt : Time.Time;
    status : NewPauseRequestStatus;
    processedAt : ?Time.Time;
    adminMessage : ?Text;
  };

  type OldActor = {
    members : Map.Map<Text, MemberProfile>;
    diets : Map.Map<Text, DietChart>;
    workouts : Map.Map<Text, WorkoutChart>;
    packages : Map.Map<Text, MembershipPackage>;
    attendance : Map.Map<Text, List.List<AttendanceRecord>>;
    videos : Map.Map<Text, VideoMetadata>;
    userProfiles : Map.Map<Principal, UserProfile>;
    pauseRequests : Map.Map<Text, OldPauseRequest>;
    gymLocation : LocationCoordinates;
    authorizedRadiusMeters : Nat;
    idCounter : Nat;
  };

  type NewActor = {
    members : Map.Map<Text, MemberProfile>;
    diets : Map.Map<Text, DietChart>;
    workouts : Map.Map<Text, WorkoutChart>;
    packages : Map.Map<Text, MembershipPackage>;
    attendance : Map.Map<Text, List.List<AttendanceRecord>>;
    videos : Map.Map<Text, VideoMetadata>;
    userProfiles : Map.Map<Principal, UserProfile>;
    pauseRequests : Map.Map<Text, NewPauseRequest>;
    gymLocation : LocationCoordinates;
    authorizedRadiusMeters : Nat;
    idCounter : Nat;
  };

  public func run(old : OldActor) : NewActor {
    func convertRequest(oldRequest : OldPauseRequest) : NewPauseRequest {
      {
        id = oldRequest.id;
        memberId = oldRequest.memberId;
        requestedAt = oldRequest.requestedAt;
        processedAt = oldRequest.processedAt;
        adminMessage = oldRequest.adminMessage;
        status = switch (oldRequest.status) {
          case (#pending) { #pending };
          case (#approved) { #approved };
          case (#denied) { #denied };
        };
      };
    };

    let newPauseRequests = old.pauseRequests.map<Text, OldPauseRequest, NewPauseRequest>(
      func(_id, oldRequest) { convertRequest(oldRequest) }
    );

    // Return new actor state
    {
      old with
      pauseRequests = newPauseRequests
    };
  };
};
