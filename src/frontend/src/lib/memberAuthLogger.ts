// Dedicated logging utility for member authentication
// Provides structured logging for debugging authentication flows

interface LogEntry {
  timestamp: string;
  attemptId: string;
  memberId?: string;
  eventType: string;
  data?: any;
}

class MemberAuthLogger {
  private attemptId: string = '';

  private generateAttemptId(): string {
    return `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private maskMemberId(memberId: string): string {
    if (memberId.length <= 4) return '***';
    return memberId.slice(0, 2) + '***' + memberId.slice(-2);
  }

  private logInternal(level: 'info' | 'warn' | 'error', entry: Omit<LogEntry, 'timestamp'>): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      ...entry,
    };

    const prefix = `[MemberAuth:${level.toUpperCase()}]`;
    const message = `${prefix} ${entry.eventType}`;

    if (level === 'error') {
      console.error(message, logEntry);
    } else if (level === 'warn') {
      console.warn(message, logEntry);
    } else {
      console.log(message, logEntry);
    }
  }

  loginAttempt(memberId: string): string {
    this.attemptId = this.generateAttemptId();
    this.logInternal('info', {
      attemptId: this.attemptId,
      memberId: this.maskMemberId(memberId),
      eventType: 'LOGIN_ATTEMPT',
      data: { maskedId: this.maskMemberId(memberId) },
    });
    return this.attemptId;
  }

  validationRequest(memberId: string): void {
    this.logInternal('info', {
      attemptId: this.attemptId,
      memberId: this.maskMemberId(memberId),
      eventType: 'VALIDATION_REQUEST',
    });
  }

  validationResponse(memberId: string, response: any): void {
    this.logInternal('info', {
      attemptId: this.attemptId,
      memberId: this.maskMemberId(memberId),
      eventType: 'VALIDATION_RESPONSE',
      data: response,
    });
  }

  validationError(memberId: string, error: any): void {
    this.logInternal('error', {
      attemptId: this.attemptId,
      memberId: this.maskMemberId(memberId),
      eventType: 'VALIDATION_ERROR',
      data: {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        errorObject: error,
      },
    });
  }

  localStorageOperation(operation: 'set' | 'remove', memberId?: string): void {
    this.logInternal('info', {
      attemptId: this.attemptId,
      memberId: memberId ? this.maskMemberId(memberId) : undefined,
      eventType: 'LOCALSTORAGE_OPERATION',
      data: { operation },
    });
  }

  crossTabSync(memberId: string | null): void {
    this.logInternal('info', {
      attemptId: this.attemptId,
      memberId: memberId ? this.maskMemberId(memberId) : undefined,
      eventType: 'CROSS_TAB_SYNC',
      data: { hasMemberId: !!memberId },
    });
  }

  profileSave(memberId: string, success: boolean): void {
    this.logInternal(success ? 'info' : 'error', {
      attemptId: this.attemptId,
      memberId: this.maskMemberId(memberId),
      eventType: 'PROFILE_SAVE',
      data: { success },
    });
  }

  loginSuccess(memberId: string, status: string): void {
    this.logInternal('info', {
      attemptId: this.attemptId,
      memberId: this.maskMemberId(memberId),
      eventType: status === 'paused' ? 'LOGIN_SUCCESS_PAUSED' : 'LOGIN_SUCCESS',
      data: { status },
    });
  }
}

// Export singleton instance
export const memberAuthLogger = new MemberAuthLogger();
