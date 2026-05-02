package com.fooddelivery.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    @ResponseBody
    public ErrorResponse handleException(HttpServletRequest request, Exception e) {
        return ErrorResponse.error(500, e.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseBody
    public ErrorResponse handleIllegalArgumentException(HttpServletRequest request, IllegalArgumentException e) {
        return ErrorResponse.error(400, e.getMessage());
    }

    public static class ErrorResponse {
        private int code;
        private String message;
        private long timestamp;

        public static ErrorResponse error(int code, String message) {
            ErrorResponse response = new ErrorResponse();
            response.setCode(code);
            response.setMessage(message);
            response.setTimestamp(System.currentTimeMillis());
            return response;
        }

        public int getCode() {
            return code;
        }

        public void setCode(int code) {
            this.code = code;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public long getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(long timestamp) {
            this.timestamp = timestamp;
        }
    }
}
