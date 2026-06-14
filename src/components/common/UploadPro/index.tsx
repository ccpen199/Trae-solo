import React, { useState } from 'react';
import { Upload, Button, message, Modal, Image, Progress } from 'antd';
import { UploadOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd';
import { cn } from '@/lib/utils';

export type UploadType = 'image' | 'file' | 'idCard' | 'businessLicense' | 'certificate';

export interface UploadProProps extends Omit<UploadProps, 'onChange'> {
  value?: UploadFile[];
  onChange?: (files: UploadFile[]) => void;
  maxCount?: number;
  maxSize?: number;
  accept?: string;
  uploadType?: UploadType;
  listType?: 'text' | 'picture' | 'picture-card';
  showUploadList?: boolean;
  showPreview?: boolean;
  buttonText?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
}

const typeConfig: Record<UploadType, { accept: string; maxSize: number; maxCount: number }> = {
  image: {
    accept: 'image/*',
    maxSize: 5,
    maxCount: 9,
  },
  file: {
    accept: '.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx',
    maxSize: 20,
    maxCount: 10,
  },
  idCard: {
    accept: 'image/*',
    maxSize: 5,
    maxCount: 2,
  },
  businessLicense: {
    accept: 'image/*',
    maxSize: 5,
    maxCount: 1,
  },
  certificate: {
    accept: 'image/*',
    maxSize: 5,
    maxCount: 5,
  },
};

const UploadPro: React.FC<UploadProProps> = ({
  value,
  onChange,
  maxCount,
  maxSize,
  accept,
  uploadType = 'image',
  listType = 'picture-card',
  showUploadList = true,
  showPreview = true,
  buttonText = '上传',
  description,
  className,
  disabled,
  ...rest
}) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const config = typeConfig[uploadType];
  const finalMaxCount = maxCount || config.maxCount;
  const finalMaxSize = maxSize || config.maxSize;
  const finalAccept = accept || config.accept;

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const isLtSize = file.size / 1024 / 1024 < finalMaxSize;
    if (!isLtSize) {
      message.error(`文件大小不能超过 ${finalMaxSize}MB!`);
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File);
    }
    setPreviewImage(file.url || (file.preview as string));
    setPreviewVisible(true);
    setPreviewTitle(file.name || file.url?.substring(file.url.lastIndexOf('/') + 1) || '预览');
  };

  const handleChange: UploadProps['onChange'] = ({ fileList }) => {
    onChange?.(fileList);
  };

  const handleRemove = (file: UploadFile) => {
    const newFileList = value?.filter(f => f.uid !== file.uid) || [];
    onChange?.(newFileList);
    return true;
  };

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const uploadButton = (
    <div>
      <UploadOutlined className="text-xl" />
      <div className="mt-2 text-sm text-neutral-500">{buttonText}</div>
      {description && <div className="text-xs text-neutral-400 mt-1">{description}</div>}
    </div>
  );

  const itemRender: UploadProps['itemRender'] = (originNode, file, _fileList, actions) => {
    if (file.status === 'uploading') {
      return (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-center p-2">
            <div className="text-xs mb-2">上传中...</div>
            <Progress percent={file.percent || 0} size="small" />
          </div>
        </div>
      );
    }

    if (file.status === 'error') {
      return (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-center">
            <div className="text-danger-500 text-sm mb-1">上传失败</div>
            <Button size="small" danger onClick={() => actions.remove()}>
              删除
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full group">
        {listType === 'picture-card' && (
          <>
            <Image
              src={file.url || file.preview}
              alt={file.name}
              className="w-full h-full object-cover"
              preview={false}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {showPreview && (
                <Button
                  type="text"
                  icon={<EyeOutlined />}
                  className="!text-white hover:!text-white !bg-white/20"
                  onClick={() => handlePreview(file)}
                />
              )}
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                className="!text-white hover:!text-white !bg-white/20"
                onClick={() => actions.remove()}
              />
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={cn(className)}>
      <Upload
        fileList={value}
        onChange={handleChange}
        beforeUpload={beforeUpload}
        listType={listType}
        accept={finalAccept}
        multiple={finalMaxCount > 1}
        maxCount={finalMaxCount}
        showUploadList={showUploadList}
        onPreview={showPreview ? handlePreview : undefined}
        onRemove={handleRemove}
        itemRender={listType === 'picture-card' ? itemRender : undefined}
        disabled={disabled}
        {...rest}
      >
        {(value?.length || 0) >= finalMaxCount ? null : uploadButton}
      </Upload>

      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width="auto"
      >
        <img alt={previewTitle} style={{ maxWidth: '100%', maxHeight: '70vh' }} src={previewImage} />
      </Modal>
    </div>
  );
};

export default UploadPro;
