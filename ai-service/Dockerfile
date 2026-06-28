FROM python:3.11-slim

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive
# Increase default pip timeout globally for all installs in this image
ENV PIP_DEFAULT_TIMEOUT=300
ENV PIP_RETRIES=5

# gcc/g++ needed to compile scikit-learn C extensions
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc g++ \
    && rm -rf /var/lib/apt/lists/*

# Install heavy packages first (largest downloads) as separate layers.
# Docker caches each RUN layer, so a timeout mid-way won't restart from scratch.
RUN pip install --no-cache-dir numpy==1.26.2
RUN pip install --no-cache-dir pandas==2.1.3
RUN pip install --no-cache-dir scikit-learn==1.3.2
RUN pip install --no-cache-dir xgboost==2.0.2

# Install remaining lighter packages together
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY training ./training

# Create model output directory
RUN mkdir -p /app/models

# Train models at build time so the service starts ready
RUN python training/train_all.py || echo "Training skipped — will run on first request"

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
