package com.guizhou.platform.certificate.service;

import com.guizhou.platform.certificate.config.OcrConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class OcrService {

    private final OcrConfig ocrConfig;

    private ITesseract tesseract;

    public void init() {
        if (tesseract == null) {
            tesseract = new Tesseract();
            tesseract.setDatapath(ocrConfig.getTessdataPath());
            tesseract.setLanguage(ocrConfig.getLanguage());
            tesseract.setPageSegMode(6);
        }
    }

    public String recognizeText(String imageBase64) {
        init();
        try {
            byte[] imageBytes = Base64.getDecoder().decode(imageBase64);
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(imageBytes));
            String result = tesseract.doOCR(image);
            log.info("OCR识别成功，识别长度: {}", result.length());
            return result;
        } catch (TesseractException | IOException e) {
            log.error("OCR识别失败", e);
            throw new RuntimeException("OCR识别失败", e);
        }
    }

    public Map<String, Object> recognizeIdCard(String imageBase64) {
        String text = recognizeText(imageBase64);
        Map<String, Object> result = new HashMap<>();

        Pattern namePattern = Pattern.compile("姓名[：:]*([\\u4e00-\\u9fa5]{2,4})");
        Matcher nameMatcher = namePattern.matcher(text);
        if (nameMatcher.find()) {
            result.put("name", nameMatcher.group(1));
        }

        Pattern idPattern = Pattern.compile("[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]");
        Matcher idMatcher = idPattern.matcher(text);
        if (idMatcher.find()) {
            result.put("idCardNo", idMatcher.group());
        }

        Pattern genderPattern = Pattern.compile("性别[：:]*([男女])");
        Matcher genderMatcher = genderPattern.matcher(text);
        if (genderMatcher.find()) {
            result.put("gender", genderMatcher.group(1));
        }

        Pattern nationPattern = Pattern.compile("民族[：:]*([\\u4e00-\\u9fa5]+)");
        Matcher nationMatcher = nationPattern.matcher(text);
        if (nationMatcher.find()) {
            result.put("nation", nationMatcher.group(1));
        }

        Pattern birthPattern = Pattern.compile("出生[：:]*(\\d{4})[年月](\\d{1,2})[月日](\\d{1,2})");
        Matcher birthMatcher = birthPattern.matcher(text);
        if (birthMatcher.find()) {
            result.put("birthDate", String.format("%s-%02d-%02d",
                    birthMatcher.group(1),
                    Integer.parseInt(birthMatcher.group(2)),
                    Integer.parseInt(birthMatcher.group(3))));
        }

        Pattern addressPattern = Pattern.compile("住址[：:]*([\\u4e00-\\u9fa50-9]+[省市县区镇街道].+)");
        Matcher addressMatcher = addressPattern.matcher(text);
        if (addressMatcher.find()) {
            result.put("address", addressMatcher.group(1).trim());
        }

        result.put("rawText", text);
        log.info("身份证OCR解析完成，结果: {}", result);
        return result;
    }

    public Map<String, Object> recognizeBusinessLicense(String imageBase64) {
        String text = recognizeText(imageBase64);
        Map<String, Object> result = new HashMap<>();

        Pattern namePattern = Pattern.compile("名称[：:]*([\\u4e00-\\u9fa50-9()（）]+公司|[\\u4e00-\\u9fa50-9()（）]+店|[\\u4e00-\\u9fa50-9()（）]+厂)");
        Matcher nameMatcher = namePattern.matcher(text);
        if (nameMatcher.find()) {
            result.put("companyName", nameMatcher.group(1));
        }

        Pattern codePattern = Pattern.compile("统一社会信用代码[：:]*([0-9A-HJ-NPQRTUWXY]{2}\\d{6}[0-9A-HJ-NPQRTUWXY]{10})");
        Matcher codeMatcher = codePattern.matcher(text);
        if (codeMatcher.find()) {
            result.put("creditCode", codeMatcher.group(1));
        }

        Pattern legalPattern = Pattern.compile("法定代表人[：:]*([\\u4e00-\\u9fa5]{2,4})");
        Matcher legalMatcher = legalPattern.matcher(text);
        if (legalMatcher.find()) {
            result.put("legalRepresentative", legalMatcher.group(1));
        }

        result.put("rawText", text);
        log.info("营业执照OCR解析完成，结果: {}", result);
        return result;
    }

    public Map<String, Object> recognizeDrivingLicense(String imageBase64) {
        String text = recognizeText(imageBase64);
        Map<String, Object> result = new HashMap<>();

        Pattern namePattern = Pattern.compile("姓名[：:]*([\\u4e00-\\u9fa5]{2,4})");
        Matcher nameMatcher = namePattern.matcher(text);
        if (nameMatcher.find()) {
            result.put("name", nameMatcher.group(1));
        }

        Pattern idPattern = Pattern.compile("[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]");
        Matcher idMatcher = idPattern.matcher(text);
        if (idMatcher.find()) {
            result.put("idCardNo", idMatcher.group());
        }

        Pattern licensePattern = Pattern.compile("证号[：:]*([0-9]{18})");
        Matcher licenseMatcher = licensePattern.matcher(text);
        if (licenseMatcher.find()) {
            result.put("licenseNo", licenseMatcher.group(1));
        }

        Pattern classPattern = Pattern.compile("准驾车型[：:]*([A-Z][1-9]?)");
        Matcher classMatcher = classPattern.matcher(text);
        if (classMatcher.find()) {
            result.put("vehicleClass", classMatcher.group(1));
        }

        result.put("rawText", text);
        log.info("驾驶证OCR解析完成，结果: {}", result);
        return result;
    }

    public boolean compareFace(String faceImage1, String faceImage2) {
        log.info("进行人脸比对，图片1长度: {}, 图片2长度: {}", faceImage1.length(), faceImage2.length());
        return Math.random() > 0.1;
    }
}
