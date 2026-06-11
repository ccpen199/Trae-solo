package com.guizhou.platform.auth.service;

public interface FaceRecognitionService {

    boolean verify(String faceImage, String storedFaceFeature);

    String extractFeature(String faceImage);
}
