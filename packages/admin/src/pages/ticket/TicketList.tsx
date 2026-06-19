import { ProTable, ModalForm, ProFormSelect, ProFormText, ProFormTextArea, ProFormDateRangePicker } from '@ant-design/pro-components';
import { Tag, Space, Button, Typography, App, Drawer, Timeline, Card, Descriptions, Rate, Avatar, Input, Tooltip, Col, Row } from 'antd';
import { PlusOutlined, UserSwitchOutlined, BellOutlined, ExportOutlined, EyeOutlined, CheckCircleOutlined, EditOutlined, CloseCircleOutlined, MessageOutlined, SendOutlined, StarOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useUserStore, USER_ROLES } from '@/store/user';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { TextArea } = Input;

const typeMap: Record<string, { text: string; color: string }> = {
  REPAIR: { text: '报修', color: 'blue' },
  COMPLAINT: { text: '投诉', color: 'red' },
  SUGGESTION: { text: '建议', color: 'green' },
  OTHER: { text: '其他', color: 'default' },
};

const statusMap: Record<string, { text