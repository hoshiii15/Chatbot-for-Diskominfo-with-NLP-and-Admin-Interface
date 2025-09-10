# FAQ Chatbot Admin Dashboard System

A consolidated documentation for the FAQ Chatbot Admin Dashboard system. This file combines project-level documentation and the Python chatbot notes into a single reference.

---

## Quick links

- Admin Frontend: `admin-frontend/`
- Backend API: `admin-backend/`
- Python bot: `python-bot/`
- Shared types: `shared/types/`
- Compose files: `docker-compose.yml`, `docker-compose.dev.yml`

---

## Features (high level)

- Admin dashboard: FAQ management (CRUD), environment switching (stunting / PPID), user management, and role-based access control.
- Analytics: usage metrics, popular questions, confidence distribution, and category analytics.
- Logs: real-time chat log viewer with export and pagination.
- System health: automated health checks for Python bot, database, and filesystem; restart and quick actions.
- Python bot: lightweight Flask-based FAQ assistant using simple NLP (NLTK/scikit-learn similarity matching) with JSON-based FAQ stores for PPID and Stunting domains.

---

## Development quick start

Prerequisites:

- Node.js 18+ and npm
- Python 3.8+ and pip
- Docker (optional)

Start services for local development (from repository root):

```powershell
# Start all (recommended if configured)
npm run dev

# or individually
# Python bot
npm run dev:python

# Backend
npm run dev:backend

# Frontend
npm run dev:frontend
```

Frontend runs at `http://localhost:3000`, backend at `http://localhost:3001`, and python bot at `http://localhost:5000` by default.

Default admin credentials for development:

- username: `admin` / password: `admin123`

---

## Python bot (summary)

The Python bot is a simple Flask application that serves FAQ answers for two domains:

- PPID: FAQ data located at `python-bot/data/faq_ppid.json`
- Stunting: FAQ data located at `python-bot/data/faq_stunting.json`

Core behaviors:

- Accepts POST /ask with { question, env } and returns the best-matching FAQ answer.
- Uses NLTK for tokenization and classic similarity matching to rank candidate FAQs.
- Includes a small `bot.log` file to track interactions.

Development:

```powershell
cd python-bot
pip install -r requirements.txt
python app.py
```

---

## API highlights

- `POST /api/auth/login` - login and receive JWT
- `GET /api/faq/:env` - list FAQs for environment
- `POST /api/faq/:env` - add question(s)
- `PUT /api/faq/:env/:id` - update FAQ
- `DELETE /api/faq/:env/:id` - delete FAQ
- `GET /api/analytics` - analytics payload (query params: environment, days)
- `GET /api/logs` - paginated chat logs
- `GET /api/health` - system health

Refer to code in `admin-backend/src/routes` for full request/response shapes.

---

## File locations & notes

- Frontend: `admin-frontend/src/app/` — app router with dashboard pages, UI components under `components/ui`.
- Backend: `admin-backend/src/` — controllers, services, models and routes. Python bot integration is in `services/PythonBotService.ts`.
- Python bot data: `python-bot/data/` — edit JSON FAQ files to add or modify domain questions.

---

## Maintenance: safe cleanup performed

The following generated/cache files were removed to keep the repo clean:

- `python-bot/__pycache__/*.pyc` (Python bytecode cache)
- duplicate `python-bot/README.md` was merged into this file

If you want additional cleanup (node_modules, build artifacts, backups), tell me which folders to target and I will prepare a safe plan.

---

## Acknowledgements

Made with ❤️ by Hosea Raka

Special thanks to contributors and the Diskominfo team for guidance and data.

---

### Code Structure

#### Backend Architecture

```
admin-backend/src/
├── app.ts              # Main application entry
├── controllers/        # Route handlers
├── middleware/         # Express middleware
├── models/            # Database models
├── routes/            # API route definitions
├── services/          # Business logic
│   ├── PythonBotService.ts    # Python bot integration
│   ├── FileManagerService.ts  # FAQ file management
│   ├── SocketService.ts       # WebSocket handling
│   └── DatabaseService.ts     # Database operations
└── utils/             # Utilities and config
    ├── config.ts      # Configuration management
    └── logger.ts      # Logging setup
```

#### Frontend Architecture

```
admin-frontend/src/
├── app/               # Next.js 14 app router
│   ├── (auth)/       # Authentication pages
│   ├── (dashboard)/  # Dashboard pages
│   └── globals.css   # Global styles
├── components/        # Reusable components
│   ├── ui/           # shadcn/ui components
│   ├── forms/        # Form components
│   └── charts/       # Chart components
├── hooks/            # Custom React hooks
├── lib/              # Utilities and API clients
└── types/            # TypeScript type definitions
```

### Adding New Features

#### Backend: Adding New API Endpoint

1. Create route handler in `routes/`
2. Add business logic in `services/`
3. Update middleware if needed
4. Add tests
5. Update API documentation

#### Frontend: Adding New Page

1. Create page component in `app/`
2. Add to navigation
3. Create necessary components
4. Implement API integration
5. Add TypeScript types

### Testing

```bash
# Backend tests
cd admin-backend
npm run test
npm run test:watch

# Frontend tests
cd admin-frontend
npm run test
npm run test:watch

# E2E tests
npm run test:e2e
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Coding Standards

- TypeScript for type safety
- ESLint + Prettier for code formatting
- Conventional commits
- Comprehensive documentation
- Unit tests for new features

## 📞 Support

For issues and questions:

- **GitHub Issues**: Create an issue for bugs or feature requests
- **Email**: admin@diskominfo.go.id
- **Documentation**: Check this README and inline code comments

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] AI-powered FAQ suggestions
- [ ] Mobile app for administrators
- [ ] Advanced user management
- [ ] API rate limiting by user
- [ ] Backup and restore functionality
- [ ] Integration with external services

---

**Built with ❤️ for Diskominfo by the Development Team**
