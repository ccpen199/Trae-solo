package com.guizhou.platform.gateway.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;
import springfox.documentation.swagger.web.SwaggerResource;
import springfox.documentation.swagger.web.SwaggerResourcesProvider;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Configuration
public class SwaggerConfig {

    private static final String[] SERVICE_NAMES = {
            "platform-auth", "platform-data-share", "platform-certificate",
            "platform-subsidy", "platform-ticket", "platform-monitor",
            "service-government", "service-payment", "service-living",
            "service-subsidy-verify"
    };

    private static final String[] SERVICE_TITLES = {
            "认证授权服务", "数据共享服务", "电子证照服务",
            "补贴发放服务", "工单管理服务", "监控中心服务",
            "政务服务", "支付服务", "生活服务",
            "补贴核销服务"
    };

    @Bean
    public SwaggerResourcesProvider swaggerResourcesProvider() {
        return () -> {
            List<SwaggerResource> resources = new ArrayList<>();
            for (int i = 0; i < SERVICE_NAMES.length; i++) {
                resources.add(createResource(SERVICE_TITLES[i], SERVICE_NAMES[i]));
            }
            return resources;
        };
    }

    private SwaggerResource createResource(String name, String serviceName) {
        SwaggerResource resource = new SwaggerResource();
        resource.setName(name);
        resource.setLocation("/" + serviceName + "/v3/api-docs");
        resource.setSwaggerVersion("3.0");
        return resource;
    }

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("贵州省数字服务平台API文档")
                        .description("贵州省全域数字服务融合平台中枢系统API接口文档")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("贵州省数字服务平台技术团队")
                                .email("support@guizhou.gov.cn")
                                .url("https://www.guizhou.gov.cn")
                        )
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")
                        )
                );
    }

    @Bean
    public org.springframework.web.reactive.function.server.RouterFunction<
            org.springframework.web.reactive.function.server.ServerResponse>
    swaggerRouterFunction() {
        return org.springframework.web.reactive.function.server.RouterFunctions
                .route()
                .GET("/swagger-resources", request ->
                        org.springframework.web.reactive.function.server.ServerResponse.ok()
                                .body(Mono.just(swaggerResourcesProvider().get()), List.class))
                .GET("/swagger-resources/configuration/ui", request ->
                        org.springframework.web.reactive.function.server.ServerResponse.ok()
                                .body(Mono.just(createUiConfiguration()), Object.class))
                .GET("/swagger-resources/configuration/security", request ->
                        org.springframework.web.reactive.function.server.ServerResponse.ok()
                                .body(Mono.just(createSecurityConfiguration()), Object.class))
                .build();
    }

    private Object createUiConfiguration() {
        return new Object() {
            public String getDeepLinking() { return "true"; }
            public String getDisplayOperationId() { return "false"; }
            public String getDefaultModelsExpandDepth() { return "1"; }
            public String getDefaultModelExpandDepth() { return "1"; }
            public String getDefaultModelRendering() { return "model"; }
            public String getDisplayRequestDuration() { return "false"; }
            public String getDocExpansion() { return "none"; }
            public String getFilter() { return "false"; }
            public String getMaxDisplayedTags() { return "100"; }
            public String getOperationsSorter() { return "alpha"; }
            public String getShowExtensions() { return "false"; }
            public String getShowCommonExtensions() { return "false"; }
            public String getTagsSorter() { return "alpha"; }
            public String getValidatorUrl() { return ""; }
            public String getApisSorter() { return "alpha"; }
            public String getJsonEditor() { return "false"; }
            public String getShowRequestHeaders() { return "false"; }
        };
    }

    private Object createSecurityConfiguration() {
        return new Object() {
            public String getClientId() { return ""; }
            public String getClientSecret() { return ""; }
            public String getRealm() { return ""; }
            public String getAppName() { return ""; }
            public String getScopeSeparator() { return " "; }
            public String getAdditionalQueryStringParams() { return "{}"; }
            public String getUseBasicAuthenticationWithAccessCodeGrant() { return "false"; }
            public String getUsePkceWithAuthorizationCodeGrant() { return "false"; }
        };
    }
}
