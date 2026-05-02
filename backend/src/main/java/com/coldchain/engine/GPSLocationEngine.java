package com.coldchain.engine;

import com.coldchain.entity.Task;
import com.coldchain.repository.TaskRepository;
import com.coldchain.util.MapBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Component
public class GPSLocationEngine {
    private static final Logger logger = LoggerFactory.getLogger(GPSLocationEngine.class);
    
    @Autowired
    private TaskRepository taskRepository;
    
    private final Map<Long, LocationData> currentLocations = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
    
    public static class LocationData {
        private Double latitude;
        private Double longitude;
        private String address;
        private Double speed;
        private Double heading;
        private LocalDateTime timestamp;
        
        public LocationData(Double latitude, Double longitude, String address, Double speed, Double heading) {
            this.latitude = latitude;
            this.longitude = longitude;
            this.address = address;
            this.speed = speed;
            this.heading = heading;
            this.timestamp = LocalDateTime.now();
        }
        
        public Double getLatitude() { return latitude; }
        public Double getLongitude() { return longitude; }
        public String getAddress() { return address; }
        public Double getSpeed() { return speed; }
        public Double getHeading() { return heading; }
        public LocalDateTime getTimestamp() { return timestamp; }
    }
    
    public void updateLocation(Long taskId, Double latitude, Double longitude, String address, Double speed, Double heading) {
        LocationData locationData = new LocationData(latitude, longitude, address, speed, heading);
        currentLocations.put(taskId, locationData);
        logger.debug("Updated location for task {}: {}, {}", taskId, latitude, longitude);
    }
    
    public void handleGPSData(@Payload Map<String, Object> data) {
        try {
            Long taskId = Long.parseLong(data.get("taskId").toString());
            Double latitude = Double.parseDouble(data.get("latitude").toString());
            Double longitude = Double.parseDouble(data.get("longitude").toString());
            String address = data.containsKey("address") ? data.get("address").toString() : null;
            Double speed = data.containsKey("speed") ? Double.parseDouble(data.get("speed").toString()) : null;
            Double heading = data.containsKey("heading") ? Double.parseDouble(data.get("heading").toString()) : null;
            
            updateLocation(taskId, latitude, longitude, address, speed, heading);
        } catch (Exception e) {
            logger.error("Error handling GPS data: {}", e.getMessage(), e);
        }
    }
    
    public LocationData getCurrentLocation(Long taskId) {
        return currentLocations.get(taskId);
    }
    
    public Map<String, Object> getLocationInfo(Long taskId) {
        LocationData location = currentLocations.get(taskId);
        if (location == null) {
            return null;
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("latitude", location.getLatitude());
        result.put("longitude", location.getLongitude());
        result.put("address", location.getAddress() != null ? location.getAddress() : "");
        result.put("speed", location.getSpeed() != null ? location.getSpeed() : 0);
        result.put("heading", location.getHeading() != null ? location.getHeading() : 0);
        result.put("timestamp", location.getTimestamp().toString());
        return result;
    }
    
    public Double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
        final int R = 6371;
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
    
    public Map<String, Object> getRouteProgress(Long taskId) {
        Task task = taskRepository.findById(taskId).orElse(null);
        if (task == null) {
            return MapBuilder.of(
                "progress", 0,
                "distanceRemaining", 0.0,
                "estimatedArrival", "Unknown"
            );
        }
        
        LocationData currentLocation = currentLocations.get(taskId);
        if (currentLocation == null) {
            return MapBuilder.of(
                "progress", 0,
                "distanceRemaining", 0.0,
                "estimatedArrival", "Unknown"
            );
        }
        
        Map<String, Object> startLocation = task.getStartLocation();
        Map<String, Object> endLocation = task.getEndLocation();
        
        if (startLocation == null || endLocation == null) {
            return MapBuilder.of(
                "progress", 0,
                "distanceRemaining", 0.0,
                "estimatedArrival", "Unknown"
            );
        }
        
        Object startLatObj = startLocation.get("lat");
        Object startLngObj = startLocation.get("lng");
        Object endLatObj = endLocation.get("lat");
        Object endLngObj = endLocation.get("lng");
        
        if (startLatObj == null || startLngObj == null || endLatObj == null || endLngObj == null) {
            return MapBuilder.of(
                "progress", 0,
                "distanceRemaining", 0.0,
                "estimatedArrival", "Unknown"
            );
        }
        
        Double startLat = startLatObj instanceof Number ? ((Number) startLatObj).doubleValue() : Double.parseDouble(startLatObj.toString());
        Double startLng = startLngObj instanceof Number ? ((Number) startLngObj).doubleValue() : Double.parseDouble(startLngObj.toString());
        Double endLat = endLatObj instanceof Number ? ((Number) endLatObj).doubleValue() : Double.parseDouble(endLatObj.toString());
        Double endLng = endLngObj instanceof Number ? ((Number) endLngObj).doubleValue() : Double.parseDouble(endLngObj.toString());
        
        double totalDistance = calculateDistance(startLat, startLng, endLat, endLng);
        double distanceTraveled = calculateDistance(startLat, startLng, currentLocation.getLatitude(), currentLocation.getLongitude());
        double distanceRemaining = calculateDistance(currentLocation.getLatitude(), currentLocation.getLongitude(), endLat, endLng);
        
        double progress = totalDistance > 0 ? (distanceTraveled / totalDistance) * 100 : 0;
        progress = Math.min(100, Math.max(0, progress));
        
        double speed = currentLocation.getSpeed() != null ? currentLocation.getSpeed() : 60.0;
        double hoursRemaining = distanceRemaining / speed;
        
        String estimatedArrival;
        if (speed > 0) {
            LocalDateTime arrival = LocalDateTime.now().plusHours((long) hoursRemaining);
            estimatedArrival = arrival.toString();
        } else {
            estimatedArrival = "Unknown";
        }
        
        return MapBuilder.of(
            "progress", Math.round(progress * 100) / 100.0,
            "distanceTraveled", Math.round(distanceTraveled * 100) / 100.0,
            "distanceRemaining", Math.round(distanceRemaining * 100) / 100.0,
            "totalDistance", Math.round(totalDistance * 100) / 100.0,
            "estimatedArrival", estimatedArrival
        );
    }
    
    public void simulateLocation(Long taskId) {
        scheduler.scheduleAtFixedRate(new Runnable() {
            @Override
            public void run() {
                double baseLat = 39.9042;
                double baseLng = 116.4074;
                
                double newLat = baseLat + (Math.random() - 0.5) * 0.1;
                double newLng = baseLng + (Math.random() - 0.5) * 0.1;
                
                updateLocation(taskId, newLat, newLng, null, 60.0 + Math.random() * 40, Math.random() * 360);
            }
        }, 0, 30, TimeUnit.SECONDS);
    }
}
