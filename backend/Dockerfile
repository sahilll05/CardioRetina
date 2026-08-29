# Use a slim Python 3.10 image to keep the base image size small
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Install critical system dependencies
# libgl1-mesa-glx and libglib2.0-0 are REQUIRED for OpenCV to run without crashing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Upgrade pip
RUN pip install --upgrade pip

# CRITICAL OPTIMIZATION: Install PyTorch CPU-only version first.
# By default, Railway has no GPUs. Installing default PyTorch pulls in ~3GB of CUDA drivers,
# which guarantees an Out-of-Memory (OOM) crash on Railway. The CPU-only wheel is ~200MB.
RUN pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Copy requirements and install the rest
COPY requirements.txt .

# We pass the extra index url again just to be completely safe that pip doesn't
# try to "upgrade" torch back to the CUDA version when resolving dependencies.
RUN pip install --no-cache-dir -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

# Copy the rest of the application code
COPY . .

# Expose the API port
EXPOSE 8000

# Default command (Starts the FastAPI server)
# Note: In Railway, we will override this command for the Celery ML Worker service.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
