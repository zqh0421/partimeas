# Rubric Refiner

A modern web application for creating and refining rubrics to evaluate LLM output quality. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Real Model Integration**: Powered by LangChain for actual model calls to OpenAI, Anthropic, and Google AI
- **Dynamic Model Comparison**: Compare outputs from multiple AI models side-by-side
- **Intelligent Content Analysis**: Automatic keyword extraction and similarity analysis
- **Visual Comparison Tools**: Color-coded keywords and similarity indicators
- **Comprehensive Evaluation**: Multi-criteria rubric-based assessment
- **Version Control**: Save and manage different rubric versions
- **API Management**: Secure API key configuration and testing

## Prerequisites

1. Node.js 18+ and npm/pnpm
2. API keys for at least one of the supported providers:
   - OpenAI API key (for GPT-4, GPT-3.5-turbo)
   - Anthropic API key (for Claude models)
   - Google AI API key (for Gemini models)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd partimeas
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your API keys:
```env
# Required for real model calls
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here

# Google Cloud Service Account Configuration
# Option 1: Use local key file (for development)
GCP_KEY_FILE=partimeas-3f2ec1151c88.json

# Option 2: Use JSON credentials directly (recommended)
# GCP_SERVICE_ACCOUNT_SECRET_JSON='{"type":"service_account","project_id":"your-project",...}'

# Option 3: Use individual environment variables (for production/Vercel)
# GOOGLE_SERVICE_ACCOUNT_EMAIL=spreadsheetreader@partimeas.iam.gserviceaccount.com
# GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Database
POSTGRES_URL_NON_POOLING=your_postgres_url_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel Deployment

For production deployment on Vercel, set the following environment variables in your Vercel dashboard:

**Required API Keys:**
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY` 
- `GOOGLE_API_KEY`
- `POSTGRES_URL_NON_POOLING`

**Google Cloud Service Account (for test case loading):**
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: `spreadsheetreader@partimeas.iam.gserviceaccount.com`
- `GOOGLE_PRIVATE_KEY`: Copy the entire private key from `partimeas-3f2ec1151c88.json`, including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`

> **Important**: When setting `GOOGLE_PRIVATE_KEY` in Vercel, make sure to preserve all newlines. The private key should start with `-----BEGIN PRIVATE KEY-----\n` and end with `\n-----END PRIVATE KEY-----\n`.

### Troubleshooting Deployment Issues

If test cases fail to load after deployment:

1. **Check Environment Variables**: Verify all required environment variables are set in your deployment platform
2. **Google Authentication**: Ensure `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY` are correctly configured
3. **Check Logs**: Look for authentication errors in your deployment logs
4. **Authentication Methods**: The app supports multiple authentication methods (in order of precedence):
   - Individual environment variables: `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY`
   - JSON credentials: `GCP_SERVICE_ACCOUNT_SECRET_JSON` (complete service account JSON as string)
   - Local key file: `GCP_KEY_FILE` pointing to JSON file (for development)

## Usage

### 1. System Setup
- Navigate to the "System Setup" tab
- Define your system prompt that establishes evaluation context
- Use example prompts or create custom ones
- Save your configuration

### 2. Rubric Items
- Go to the "Rubric Items" tab
- Define criteria for each score level (1-5)
- Add detailed descriptions for each level
- Use example criteria or create custom ones

### 3. Test Cases
- Switch to the "Test Cases" tab
- Add input examples with expected outputs
- Categorize test cases for better organization
- Validate your rubric against real scenarios

### 4. Versioning
- Use the "Versioning" tab to save rubric versions
- Create descriptive version names and descriptions
- Export versions for backup or sharing
- Load previous versions for comparison

### 5. API Configuration
- Configure API keys in the "API Keys" tab
- Test API key validity
- Save keys locally for development
- Use environment variables for production

## API Providers

### OpenAI
- Models: GPT-4, GPT-3.5-turbo
- Use cases: General text evaluation, code review
- [Get API Key](https://platform.openai.com/api-keys)

### Anthropic
- Models: Claude-3, Claude-3.5-Sonnet
- Use cases: Advanced reasoning, detailed analysis
- [Get API Key](https://console.anthropic.com/)

### Google AI
- Models: Gemini Pro, Gemini Flash
- Use cases: Multimodal evaluation, creative content
- [Get API Key](https://aistudio.google.com/app/apikey)

## Project Structure

```
partimeas/
├── app/
│   ├── rubric/
│   │   └── page.tsx          # Main rubric interface
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Landing page
│   └── globals.css           # Global styles
├── components/
│   └── rubric/
│       ├── RubricSetup.tsx   # System prompt configuration
│       ├── RubricItems.tsx   # 1-5 scale criteria
│       ├── TestCases.tsx     # Input examples management
│       ├── RubricVersioning.tsx # Version control
│       └── ApiKeySetup.tsx   # API key management
├── .env.local                # Environment variables
└── package.json              # Dependencies
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. Create new components in `components/rubric/`
2. Add new tabs to the main interface in `app/rubric/page.tsx`
3. Update types and interfaces as needed
4. Test with different API providers

## Security Notes

- API keys are stored locally in development
- Use environment variables for production
- Never commit API keys to version control
- Rotate keys regularly for security

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- 📖 [Documentation](https://github.com/your-repo/rubric-refiner)
- 🐛 [Report Issues](https://github.com/your-repo/rubric-refiner/issues)
- 💬 [Discussions](https://github.com/your-repo/rubric-refiner/discussions)
