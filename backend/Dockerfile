# 使用官方的 OpenJDK 11 作为基础镜像
FROM openjdk:11-jre-slim

# 设置工作目录
WORKDIR /app

# 复制 JAR 文件到容器中
COPY target/retailpos-backend-1.0.0.jar app.jar

# 暴露端口
EXPOSE 8080

# 运行应用
ENTRYPOINT ["java", "-jar", "app.jar"]