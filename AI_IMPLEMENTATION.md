# AI Implementation Documentation

## Overview

This document describes the AI implementation for kanna-diary, specifically the integration of GLM4.7 API for sentiment analysis and diary generation.

## Changes Made

### 1. Sentiment Analyzer (New File: `src/sentiment-analyzer.ts`)

**Purpose**: Replace rule-based emotion analysis with AI-powered analysis using GLM4.7 API.

**Key Features**:
- Analyzes emotions from daily activity data using GLM4.7
- Returns emotion categories (happy, sad, learning, anxious, etc.)
- Calculates emotion scores (-1.0 to 1.0)
- Provides confidence levels and emotion timelines
- Includes fallback to rule-based analysis on API failures

**Methods**:
- `analyzeEmotions(data)`: Main analysis method
- `analyzeWithAI(content)`: GLM4.7 API integration
- `analyzeWithFallback(data)`: Rule-based fallback
- `calculateEmotionScore(analysis)`: Score calculation (-1.0 to 1.0)
- `categorizeEmotion(analysis)`: Japanese emotion categories

### 2. Generator (Existing: `src/Generator.ts`)

**Status**: Already using AI (GLM4.7) for diary generation.

**Key Features**:
- Generates natural diary entries using GLM4.7
- Handles special occasions (birthdays)
- Extracts learnings and insights
- Provides personality-based tone and style

### 3. Collector Updates (`src/Collector.ts`)

**Changes**:
- Integrated `SentimentAnalyzer` for AI-based emotion analysis
- Made `analyzeEmotions` method async to support API calls
- Kept rule-based analysis as fallback method

### 4. Configuration (`.env`)

**Required Environment Variables**:
```
OPENAI_API_KEY=your-api-key-here
AI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
AI_MODEL=zai/glm-4.7
```

**Note**: `.env` file is in `.gitignore` to protect API keys.

### 5. Tests

**New Test Files**:
- `tests/sentiment-analyzer.test.ts`: Tests for sentiment analysis
- `tests/generator.test.ts`: Tests for diary generation

**Test Coverage**:
- Emotion detection (happy, sad, learning, mixed)
- Emotion score validation
- Timeline generation
- Empty data handling
- Birthday special handling
- Learning extraction
- Content quality validation

## API Configuration

### GLM4.7 API

- **Base URL**: `https://open.bigmodel.cn/api/paas/v4`
- **Model**: `zai/glm-4.7`
- **Authentication**: API Key via `OPENAI_API_KEY` environment variable

### Rate Limiting

GLM4.7 API has rate limits. The implementation:
- Limits analysis to 20 most relevant items
- Uses fallback when API is unavailable
- Implements proper error handling

## Error Handling

### API Failures

When GLM4.7 API is unavailable:
1. Log the error
2. Automatically fall back to rule-based analysis
3. Return results with lower confidence

### Common Issues

1. **API Key Missing**: Check `.env` file
2. **Rate Limit**: Wait before retrying
3. **Network Issues**: Fallback to rule-based analysis
4. **Invalid Response**: Parse errors trigger fallback

## Performance Considerations

- Sentiment analysis is async and may take 1-3 seconds per call
- Cache results where appropriate
- Limit API calls by processing only relevant data
- Use streaming responses for better UX (future improvement)

## Security

- API keys stored in `.env` (not committed to git)
- No sensitive data in logs
- Error messages sanitized

## Usage Examples

### Basic Usage

```typescript
import { SentimentAnalyzer } from './sentiment-analyzer';
import { Config } from './types';

const config = loadConfig(); // Load from config.json
const analyzer = new SentimentAnalyzer(config);

// Analyze emotions
const data = collectSources(); // Collect data from sources
const emotions = await analyzer.analyzeEmotions(data);

// Get emotion score
const score = analyzer.calculateEmotionScore(emotions);
console.log(`Emotion score: ${score}`); // -1.0 to 1.0

// Get emotion category
const category = analyzer.categorizeEmotion(emotions);
console.log(`Category: ${category}`); // e.g., "喜び", "学び"
```

### Testing

Run sentiment analyzer tests:
```bash
npm run test:sentiment
```

Run generator tests:
```bash
npm run test:generator
```

Run all tests:
```bash
npm run test:all
```

## Future Improvements

1. **Streaming Responses**: Implement streaming for real-time feedback
2. **Caching**: Cache analysis results for similar data
3. **Multi-language**: Support for other languages
4. **Custom Emotions**: Allow custom emotion categories
5. **Fine-tuning**: Fine-tune model for specific use cases

## Migration Guide

### From Rule-based to AI-based Analysis

**Before** (Rule-based):
```typescript
const emotions = collector.analyzeEmotions(data); // Synchronous
```

**After** (AI-based):
```typescript
const emotions = await sentimentAnalyzer.analyzeEmotions(data); // Async
```

**Key Changes**:
1. Import `SentimentAnalyzer`
2. Create analyzer instance with config
3. Use `await` for async call
4. No code changes needed for result structure

## Troubleshooting

### Issue: API calls failing

**Solution**:
1. Check API key in `.env`
2. Verify network connectivity
3. Check API status at BigModel
4. Verify base URL and model name

### Issue: Slow performance

**Solution**:
1. Reduce data size being analyzed
2. Check network latency
3. Consider caching results
4. Use fallback if acceptable

### Issue: Poor emotion detection

**Solution**:
1. Improve data quality
2. Add more context to data
3. Adjust confidence threshold
4. Fine-tune prompts

## Contact

For issues or questions about the AI implementation, please refer to the main project documentation or create an issue on GitHub.

---

**Last Updated**: 2026-02-15
**Version**: 1.0.0
