package com.guizhou.platform.auth.service.impl;

import com.guizhou.platform.auth.service.FaceRecognitionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class FaceRecognitionServiceImpl implements FaceRecognitionService {

    @Value("${auth.face.threshold:0.85}")
    private Double threshold;

    @Value("${auth.face.api-url:http://127.0.0.1:5000}")
    private String apiUrl;

    @Value("${auth.face.api-key:face-api-key}")
    private String apiKey;

    @Override
    public boolean verify(String faceImage, String storedFaceFeature) {
        log.info("调用人脸识别API进行验证, apiUrl={}", apiUrl);
        double similarity = simulateFaceCompare(faceImage, storedFaceFeature);
        log.info("人脸比对相似度: {}, 阈值: {}", similarity, threshold);
        return similarity >= threshold;
    }

    @Override
    public String extractFeature(String faceImage) {
        log.info("调用人脸识别API提取特征, apiUrl={}", apiUrl);
        return "face_feature_" + faceImage.hashCode();
    }

    private double simulateFaceCompare(String faceImage, String storedFeature) {
        log.info("模拟人脸比对（生产环境替换为实际API调用）");
        if (faceImage == null || storedFeature == null) {
            return 0.0;
        }
        return 0.92;
    }
}
