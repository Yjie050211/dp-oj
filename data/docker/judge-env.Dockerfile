# 判题沙箱镜像：四语言工具链 + 非 root 运行用户
# 构建：docker build -t dp-oj/judge-env -f data/docker/judge-env.Dockerfile .
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      g++ \
      python3 \
      openjdk-17-jdk-headless \
      golang \
    && rm -rf /var/lib/apt/lists/*

# 非 root 运行（配合容器 --pids-limit 等限制）
RUN useradd -m -s /bin/bash judge
USER judge
WORKDIR /work
