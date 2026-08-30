FROM python:3.12-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Bake the model weights into the image so cold starts on ephemeral hosting
# don't need to re-download from Hugging Face.
RUN python -c "from faster_whisper import WhisperModel; WhisperModel('small', device='cpu', compute_type='int8')"

COPY . .

# 7860 is Hugging Face Spaces' expected container port (see app_port in
# README.md); ${PORT} stays overridable for other hosts like Render.
ENV PORT=7860
EXPOSE 7860

CMD ["sh", "-c", "gunicorn wsgi:app --bind 0.0.0.0:${PORT} --workers 1 --threads 4 --timeout 120"]
