# Snipe-IT Integration Guide

## Overview
This guide explains how to integrate Snipe-IT with the TechSupport dashboard to display real asset data.

## Prerequisites
- Snipe-IT instance (self-hosted or cloud)
- API access enabled in Snipe-IT
- Valid API token

## Configuration

### Environment Variables
Add these environment variables to your `.env` file:

```bash
# Snipe-IT Configuration
SNIPE_IT_API_BASE=https://your-snipe-it-instance.com/api/v1
SNIPE_IT_API_KEY=your-snipe-it-api-key-here
```

### Getting API Key
1. Log into your Snipe-IT instance
2. Go to **Admin** → **API Keys**
3. Click **Create New Token**
4. Give it a descriptive name (e.g., "TechSupport Dashboard")
5. Select appropriate permissions:
   - **Read Assets** (required)
   - **Read Status Labels** (required)
6. Copy the generated API key

## API Endpoints

### Available Assets
- **Endpoint**: `/api/jumpcloud/snipe/assets/available`
- **Method**: GET
- **Description**: Get list of available assets from Snipe-IT
- **Parameters**:
  - `limit` (optional): Number of assets to return (default: 100)
  - `offset` (optional): Number of assets to skip (default: 0)

### Assets Count
- **Endpoint**: `/api/jumpcloud/snipe/assets/count`
- **Method**: GET
- **Description**: Get count of assets by status
- **Response**: Includes available assets count and status breakdown

### Test Connection
- **Endpoint**: `/api/jumpcloud/snipe/test`
- **Method**: GET
- **Description**: Test Snipe-IT API connection
- **Response**: Connection status and sample data

## Usage Examples

### Test Connection
```bash
curl -X GET "http://localhost:3001/api/jumpcloud/snipe/test" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Available Assets
```bash
curl -X GET "http://localhost:3001/api/jumpcloud/snipe/assets/available?limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Assets Count
```bash
curl -X GET "http://localhost:3001/api/jumpcloud/snipe/assets/count" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Response Format

### Available Assets Response
```json
{
  "assets": [
    {
      "id": 1,
      "name": "MacBook Pro 16\"",
      "asset_tag": "MBP001",
      "model": "MacBook Pro 16-inch",
      "status_label": {
        "status_meta": "deployable"
      }
    }
  ],
  "totalAvailable": 25,
  "totalAssets": 150,
  "source": "Snipe-IT",
  "lastUpdated": "2025-10-10T19:00:00.000Z"
}
```

### Assets Count Response
```json
{
  "availableAssets": 25,
  "totalAssets": 150,
  "statusBreakdown": {
    "deployable": 25,
    "deployed": 100,
    "pending": 15,
    "archived": 10
  },
  "source": "Snipe-IT",
  "lastUpdated": "2025-10-10T19:00:00.000Z"
}
```

## Status Labels
Snipe-IT uses different status labels. Common ones include:
- `deployable` - Available for deployment
- `deployed` - Currently assigned to a user
- `pending` - Pending deployment
- `archived` - Archived/retired

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Verify `SNIPE_IT_API_BASE` URL is correct
   - Check if Snipe-IT instance is accessible
   - Ensure API is enabled in Snipe-IT settings

2. **Authentication Error**
   - Verify `SNIPE_IT_API_KEY` is correct
   - Check API key permissions
   - Ensure API key is not expired

3. **No Assets Returned**
   - Check if assets exist in Snipe-IT
   - Verify status labels are configured correctly
   - Check API permissions for asset access

### Debug Steps
1. Test connection: `GET /api/jumpcloud/snipe/test`
2. Check environment variables
3. Verify Snipe-IT API access
4. Check backend logs for detailed error messages

## Frontend Integration

The dashboard will automatically use Snipe-IT data when available. If Snipe-IT is not configured or fails, it will fall back to simulated data with appropriate notifications.

## Security Notes
- Keep API keys secure
- Use environment variables for configuration
- Regularly rotate API keys
- Monitor API usage in Snipe-IT
