# 冷链物流温控平台业务分析

## 1. 核心角色
- **货主**：创建任务，设置温度区间、时效、货品信息，查看在途状态，验收货物
- **承运商**：管理运输任务，分配司机，监控运输状态
- **司机**：执行运输任务，处理告警，完成验收
- **质控人员**：查看历史任务，分析告警率、处理率，生成质控分析报表

## 2. 业务流程
1. **任务创建**：货主创建冷链任务，设置温度区间、时效、货品信息
2. **冷链装车**：启动温控设备，开始采集数据
3. **温度采集**：实时采集温度、湿度、位置数据
4. **异常告警**：温度超限触发多级告警
5. **到货验收**：司机与货主完成验收，生成温控报告

## 3. 核心引擎
- **温度采集引擎**：实时采集温度、湿度数据
- **GPS定位引擎**：实时采集位置数据
- **异常告警引擎**：监测温度异常，触发告警
- **温控报告引擎**：生成完整温控报告

## 4. 核心字段定义

### 4.1 任务相关字段
- `task_id`：任务ID
- `shipper_id`：货主ID
- `carrier_id`：承运商ID
- `driver_id`：司机ID
- `task_status`：任务状态（待分配、已分配、运输中、已完成、已取消）
- `goods_info`：货品信息（名称、数量、重量、品类）
- `temperature_range`：温度区间（最低温度、最高温度）
- `time_limit`：时效要求
- `start_location`：起始位置
- `end_location`：目的地
- `create_time`：创建时间
- `update_time`：更新时间

### 4.2 温度数据字段
- `data_id`：数据ID
- `task_id`：关联任务ID
- `temperature`：温度值
- `humidity`：湿度值
- `location`：位置信息（经纬度）
- `collect_time`：采集时间

### 4.3 告警相关字段
- `alarm_id`：告警ID
- `task_id`：关联任务ID
- `alarm_type`：告警类型（温度超限、湿度异常）
- `alarm_level`：告警级别（一级、二级、三级）
- `alarm_value`：告警值
- `threshold_value`：阈值
- `alarm_time`：告警时间
- `handle_status`：处理状态（未处理、处理中、已处理）
- `handle_time`：处理时间
- `handle_method`：处理措施
- `handler_id`：处理人ID

### 4.4 验收相关字段
- `inspection_id`：验收ID
- `task_id`：关联任务ID
- `inspection_time`：验收时间
- `inspection_result`：验收结果（合格、不合格）
- `problem_description`：问题描述
- `shipper_signature`：货主签名
- `driver_signature`：司机签名

### 4.5 用户相关字段
- `user_id`：用户ID
- `username`：用户名
- `password`：密码（加密存储）
- `role`：角色（货主、承运商、司机、质控人员）
- `contact_info`：联系方式

## 5. 核心动作定义

### 5.1 任务管理
- `create_task`：创建任务
- `assign_task`：分配任务
- `start_task`：开始任务
- `complete_task`：完成任务
- `cancel_task`：取消任务

### 5.2 温度管理
- `collect_temperature`：采集温度数据
- `query_temperature`：查询温度数据

### 5.3 告警管理
- `trigger_alarm`：触发告警
- `handle_alarm`：处理告警
- `query_alarm`：查询告警

### 5.4 验收管理
- `create_inspection`：创建验收记录
- `query_inspection`：查询验收记录

### 5.5 报告管理
- `generate_report`：生成温控报告
- `download_report`：下载温控报告

### 5.6 用户管理
- `login`：登录
- `logout`：登出
- `change_password`：修改密码

## 6. 核心状态定义

### 6.1 任务状态
- `PENDING`：待分配
- `ASSIGNED`：已分配
- `IN_TRANSIT`：运输中
- `COMPLETED`：已完成
- `CANCELLED`：已取消

### 6.2 告警状态
- `UNHANDLED`：未处理
- `HANDLING`：处理中
- `HANDLED`：已处理

### 6.3 验收状态
- `PENDING`：待验收
- `PASSED`：验收合格
- `FAILED`：验收不合格

## 7. 核心消息定义

### 7.1 系统消息
- `TASK_CREATED`：任务创建成功
- `TASK_ASSIGNED`：任务已分配
- `TASK_STARTED`：任务已开始
- `TASK_COMPLETED`：任务已完成
- `TASK_CANCELLED`：任务已取消

### 7.2 告警消息
- `TEMPERATURE_ALARM`：温度超限告警
- `HUMIDITY_ALARM`：湿度异常告警
- `ALARM_HANDLED`：告警已处理

### 7.3 验收消息
- `INSPECTION_PASSED`：验收合格
- `INSPECTION_FAILED`：验收不合格

## 8. 核心报表定义

### 8.1 温控报告
- 任务基本信息
- 温度数据曲线
- 异常告警记录
- 处理措施记录
- 验收结果

### 8.2 质控分析报表
- 历史任务统计
- 告警率分析
- 处理率分析
- 异常类型分布
- 温度合规率

### 8.3 货主报表
- 任务列表
- 在途状态
- 历史温度数据
- 异常记录
- 验收结果

### 8.4 司机报表
- 任务列表
- 告警记录
- 处理措施
- 验收记录
