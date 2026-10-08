FROM python:3.12-slim

WORKDIR /app

# DejaVu: Hebrew + Latin + digits for printable service-call PDFs
RUN apt-get update \
  && apt-get install -y --no-install-recommends fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*

COPY service/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY service/app.py /app/app.py
COPY service/whatsapp.py /app/whatsapp.py
COPY service/mail.py /app/mail.py
COPY service/csat.py /app/csat.py
COPY service/lab_pdf.py /app/lab_pdf.py
COPY service/fonts /app/fonts
COPY service/assets /app/assets
COPY knowledge /app/knowledge

ENV PORT=8080
ENV KNOWLEDGE_DIR=/app/knowledge
ENV PYTHONUNBUFFERED=1

CMD exec gunicorn --bind "0.0.0.0:${PORT}" --workers 1 --threads 4 --timeout 120 app:app
