# Rubric Refiner

A modern web application for creating and refining rubrics to evaluate LLM output quality. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

### 🎯 Core Functionality
- **System Prompt Setup**: Configure evaluation criteria and context for LLM assessment
- **Rubric Items (1-5 Scale)**: Define detailed criteria for each evaluation level
- **Test Cases Management**: Add input examples to validate rubric effectiveness
- **Version Control**: Save and manage different rubric versions
- **API Key Management**: Secure configuration for multiple LLM providers

### 🔧 Technical Features
- **Multi-Provider Support**: OpenAI, Anthropic, and Google AI integration
- **Real-time Validation**: Test API keys and rubric configurations
- **Export Capabilities**: Download rubric versions as JSON files
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean, intuitive interface with Tailwind CSS

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-repo/rubric-refiner.git
cd rubric-refiner
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your API keys:
```env
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

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
