package com.guizhou.platform.certificate.service;

import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson2.JSON;
import com.guizhou.platform.certificate.config.IpfsConfig;
import io.ipfs.api.IPFS;
import io.ipfs.api.MerkleNode;
import io.ipfs.api.NamedStreamable;
import io.ipfs.multihash.Multihash;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class IpfsService {

    private final IPFS ipfs;
    private final IpfsConfig ipfsConfig;

    public String uploadJson(Map<String, Object> data) {
        try {
            String jsonStr = JSON.toJSONString(data);
            NamedStreamable.ByteArrayWrapper content = new NamedStreamable.ByteArrayWrapper(jsonStr.getBytes());
            MerkleNode response = ipfs.add(content).get(0);
            String hash = response.hash.toString();
            log.info("IPFS文件上传成功，hash: {}", hash);
            return hash;
        } catch (IOException e) {
            log.error("IPFS文件上传失败", e);
            throw new RuntimeException("IPFS文件上传失败", e);
        }
    }

    public String uploadBytes(byte[] data, String fileName) {
        try {
            NamedStreamable.ByteArrayWrapper content = new NamedStreamable.ByteArrayWrapper(fileName, data);
            MerkleNode response = ipfs.add(content).get(0);
            String hash = response.hash.toString();
            log.info("IPFS文件上传成功，hash: {}, 文件名: {}", hash, fileName);
            return hash;
        } catch (IOException e) {
            log.error("IPFS文件上传失败", e);
            throw new RuntimeException("IPFS文件上传失败", e);
        }
    }

    public Map<String, Object> downloadJson(String hash) {
        try {
            Multihash fileHash = Multihash.fromBase58(hash);
            byte[] data = ipfs.cat(fileHash);
            String jsonStr = new String(data);
            return JSON.parseObject(jsonStr, Map.class);
        } catch (IOException e) {
            log.error("IPFS文件下载失败，hash: {}", hash, e);
            throw new RuntimeException("IPFS文件下载失败", e);
        }
    }

    public byte[] downloadBytes(String hash) {
        try {
            Multihash fileHash = Multihash.fromBase58(hash);
            return ipfs.cat(fileHash);
        } catch (IOException e) {
            log.error("IPFS文件下载失败，hash: {}", hash, e);
            throw new RuntimeException("IPFS文件下载失败", e);
        }
    }

    public boolean pin(String hash) {
        try {
            Multihash fileHash = Multihash.fromBase58(hash);
            ipfs.pin.add(fileHash);
            log.info("IPFS文件固定成功，hash: {}", hash);
            return true;
        } catch (IOException e) {
            log.error("IPFS文件固定失败，hash: {}", hash, e);
            return false;
        }
    }

    public boolean unpin(String hash) {
        try {
            Multihash fileHash = Multihash.fromBase58(hash);
            ipfs.pin.rm(fileHash);
            log.info("IPFS文件取消固定成功，hash: {}", hash);
            return true;
        } catch (IOException e) {
            log.error("IPFS文件取消固定失败，hash: {}", hash, e);
            return false;
        }
    }

    public String getGatewayUrl(String hash) {
        if (StrUtil.isBlank(hash)) {
            return null;
        }
        return String.format("https://ipfs.io/ipfs/%s", hash);
    }
}
