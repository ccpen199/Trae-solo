import { Modal, Button } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  content: string;
  okText?: string;
  cancelText?: string;
  okType?: 'primary' | 'danger' | 'default';
  onOk: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  content,
  okText = '确定',
  cancelText = '取消',
  okType = 'primary',
  onOk,
  onCancel,
  loading = false,
}) => {
  return (
    <Modal
      open={open}
      title={
        <div className="flex items-center gap-2">
          {okType === 'danger' && <ExclamationCircleOutlined className="text-red-500" />}
          {title}
        </div>
      }
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {cancelText}
        </Button>,
        <Button
          key="ok"
          type={okType === 'primary' ? 'primary' : okType === 'danger' ? 'primary' : 'default'}
          danger={okType === 'danger'}
          onClick={onOk}
          loading={loading}
        >
          {okText}
        </Button>,
      ]}
    >
      <p className="text-gray-600">{content}</p>
    </Modal>
  );
};

export default ConfirmModal;
