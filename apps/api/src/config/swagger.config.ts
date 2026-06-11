import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('萌宠生活平台 API')
    .setDescription('面向宠物主的全栈式宠物生活服务平台 API 文档')
    .setVersion('1.0.0')
    .setContact('Pet Life Platform', 'https://petlife.com', 'support@petlife.com')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        description: 'JWT Authorization header using the Bearer scheme',
      },
      'JWT-auth',
    )
    .addTag('Auth', '认证相关接口')
    .addTag('Users', '用户管理接口')
    .addTag('Pets', '宠物档案接口')
    .addTag('Products', '商品管理接口')
    .addTag('Orders', '订单管理接口')
    .addTag('FlashSale', '秒杀活动接口')
    .addTag('Membership', '会员权益接口')
    .addTag('Coupons', '优惠券接口')
    .addTag('Trials', '试用活动接口')
    .addTag('Reviews', '商品评价接口')
    .addTag('Community', '社区话题接口')
    .addTag('Doctors', '医生管理接口')
    .addTag('Consultation', '在线问诊接口')
    .addTag('Adoption', '领养救助接口')
    .addTag('Social', '社交关系接口')
    .addTag('Activity', '活动参与接口')
    .addTag('Merchant', '商家入驻接口')
    .addTag('Audit', '内容审核接口')
    .addTag('Analytics', '数据分析接口')
    .addTag('Upload', '文件上传接口')
    .addTag('Admin', '管理后台接口')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    ignoreGlobalPrefix: false,
  });

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: '萌宠生活平台 API 文档',
  });
}
