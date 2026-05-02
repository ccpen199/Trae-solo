package com.coldchain.config;

import com.coldchain.entity.Role;
import com.coldchain.entity.Task;
import com.coldchain.entity.TaskStatus;
import com.coldchain.entity.User;
import com.coldchain.repository.TaskRepository;
import com.coldchain.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Component
@Profile("dev")
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        System.out.println("=== 初始化测试数据 ===");

        Map<String, Object> shipperContact = new HashMap<>();
        shipperContact.put("email", "shipper@example.com");
        shipperContact.put("phone", "13800138001");
        shipperContact.put("company", "生鲜食品有限公司");
        
        User shipper = new User();
        shipper.setUsername("shipper");
        shipper.setPassword(passwordEncoder.encode("123456"));
        shipper.setRole(Role.SHIPPER);
        shipper.setContactInfo(shipperContact);
        shipper = userRepository.save(shipper);

        Map<String, Object> carrierContact = new HashMap<>();
        carrierContact.put("email", "carrier@example.com");
        carrierContact.put("phone", "13800138002");
        carrierContact.put("company", "冷链运输有限公司");
        
        User carrier = new User();
        carrier.setUsername("carrier");
        carrier.setPassword(passwordEncoder.encode("123456"));
        carrier.setRole(Role.CARRIER);
        carrier.setContactInfo(carrierContact);
        carrier = userRepository.save(carrier);

        Map<String, Object> driverContact = new HashMap<>();
        driverContact.put("email", "driver@example.com");
        driverContact.put("phone", "13800138003");
        driverContact.put("licensePlate", "京A12345");
        
        User driver = new User();
        driver.setUsername("driver");
        driver.setPassword(passwordEncoder.encode("123456"));
        driver.setRole(Role.DRIVER);
        driver.setContactInfo(driverContact);
        driver = userRepository.save(driver);

        Map<String, Object> qualityContact = new HashMap<>();
        qualityContact.put("email", "quality@example.com");
        qualityContact.put("phone", "13800138004");
        qualityContact.put("department", "质量管控部");
        
        User quality = new User();
        quality.setUsername("quality");
        quality.setPassword(passwordEncoder.encode("123456"));
        quality.setRole(Role.QUALITY_CONTROL);
        quality.setContactInfo(qualityContact);
        quality = userRepository.save(quality);

        System.out.println("测试用户创建完成:");
        System.out.println("- 货主: shipper / 123456");
        System.out.println("- 承运商: carrier / 123456");
        System.out.println("- 司机: driver / 123456");
        System.out.println("- 质控: quality / 123456");

        for (int i = 1; i <= 5; i++) {
            Task task = new Task();
            task.setShipper(shipper);
            task.setCarrier(carrier);
            task.setDriver(driver);
            
            Map<String, Object> goodsInfo = new HashMap<>();
            goodsInfo.put("name", "冷冻食品订单" + i);
            goodsInfo.put("quantity", 100 + i * 10);
            goodsInfo.put("weight", 500 + i * 50);
            goodsInfo.put("category", i % 2 == 0 ? "fresh" : "frozen");
            task.setGoodsInfo(goodsInfo);
            
            Map<String, Object> tempRange = new HashMap<>();
            tempRange.put("min", -18.0);
            tempRange.put("max", -10.0);
            task.setTemperatureRange(tempRange);
            
            Map<String, Object> startLoc = new HashMap<>();
            startLoc.put("address", "北京市朝阳区仓库" + i);
            startLoc.put("lat", 39.90 + i * 0.01);
            startLoc.put("lng", 116.40 + i * 0.01);
            task.setStartLocation(startLoc);
            
            Map<String, Object> endLoc = new HashMap<>();
            endLoc.put("address", "上海市浦东新区收货点" + i);
            endLoc.put("lat", 31.23 + i * 0.01);
            endLoc.put("lng", 121.47 + i * 0.01);
            task.setEndLocation(endLoc);
            
            task.setTimeLimit("24小时");
            
            if (i <= 2) {
                task.setTaskStatus(TaskStatus.IN_TRANSIT);
            } else if (i <= 3) {
                task.setTaskStatus(TaskStatus.ASSIGNED);
            } else if (i <= 4) {
                task.setTaskStatus(TaskStatus.COMPLETED);
            } else {
                task.setTaskStatus(TaskStatus.PENDING);
            }

            task.setCreatedAt(LocalDateTime.now().minusDays(5 - i));
            task.setUpdatedAt(LocalDateTime.now());
            
            taskRepository.save(task);
            System.out.println("创建任务: " + task.getTaskId());
        }

        System.out.println("=== 初始化测试数据完成 ===");
    }
}
