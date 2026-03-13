package com.delifaybook.server.global.external.nlk.exception;

import com.delifaybook.server.global.error.ApiException;
import com.delifaybook.server.global.error.ErrorCode;

public class NlkException extends ApiException {

    public NlkException(ErrorCode errorCode) {
        super(errorCode);
    }

    public NlkException(ErrorCode errorCode, String message) {
        super(errorCode, message);
    }

    public NlkException(ErrorCode errorCode, String message, Throwable cause) {
        super(errorCode, message, cause);
    }
}
