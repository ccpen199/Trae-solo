package com.fooddelivery.dto;

import lombok.Data;

public class CommonResponse {
    
    @Data
    public static class Result<T> {
        private int code;
        private String message;
        private T data;
        private long timestamp;

        public static <T> Result<T> success(T data) {
            Result<T> result = new Result<>();
            result.setCode(200);
            result.setMessage("success");
            result.setData(data);
            result.setTimestamp(System.currentTimeMillis());
            return result;
        }

        public static <T> Result<T> success() {
            return success(null);
        }

        public static <T> Result<T> error(int code, String message) {
            Result<T> result = new Result<>();
            result.setCode(code);
            result.setMessage(message);
            result.setTimestamp(System.currentTimeMillis());
            return result;
        }

        public static <T> Result<T> error(String message) {
            return error(500, message);
        }
    }

    @Data
    public static class PageResult<T> {
        private long total;
        private long page;
        private long size;
        private long totalPages;
        private java.util.List<T> records;
    }
}
