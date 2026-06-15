import { SetMetadata } from '@nestjs/common';

export const SM4_DECRYPT_KEY = 'sm4_decrypt';

export interface Sm4DecryptOption {
  fields?: string[];
  decryptAll?: boolean;
}

export const Sm4Decrypt = (
  options: Sm4DecryptOption = {},
): ReturnType<typeof SetMetadata> => {
  return SetMetadata<string, Sm4DecryptOption>(SM4_DECRYPT_KEY, {
    decryptAll: true,
    fields: [],
    ...options,
  });
};
