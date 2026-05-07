#!/bin/bash
# ALEX IO — Cloud Run Deployment Script
# Usage: ./deploy.sh [project-id]

PROJECT_ID=$1
SERVICE_NAME="alex-io-core"
REGION="us-central1"

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Error: Project ID is required."
  echo "Usage: ./deploy.sh [project-id]"
  exit 1
fi

echo "🚀 Starting Cloud Run Deployment for $SERVICE_NAME..."

# 1. Build Image using Cloud Build
gcloud builds submit --config cloudbuild.yaml --substitutions=_PROJECT_ID=$PROJECT_ID .

# 2. Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 10

echo "✅ Deployment complete!"
