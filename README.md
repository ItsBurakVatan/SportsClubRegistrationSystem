# 🏆 Sports Club Registration System

A comprehensive sports club registration and management system built with modern web technologies, featuring multi-step application forms, document management, and printer integration for player cards.

## ✨ Features

- **Multi-step Application Process**: Streamlined 5-step application workflow
- **Club Management**: Complete club information and color management
- **Player Registration**: Football player registration with auto-generated license numbers
- **Document Management**: Secure file upload and management system
- **Printer Integration**: Smart 31S card printer support for player cards
- **Responsive Design**: Modern, mobile-friendly user interface
- **Real-time Validation**: Client and server-side form validation
- **Database Management**: PostgreSQL with proper relationships and constraints

## 🚀 Tech Stack

### Frontend
- **React.js** - Modern UI framework
- **TypeScript** - Type-safe development
- **Axios** - HTTP client for API communication
- **React Router** - Client-side routing

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL** - Relational database
- **Multer** - File upload middleware
- **Winston** - Logging system
- **Express Validator** - Input validation

### Additional Tools
- **ESC/POS** - Printer communication protocol
- **Rate Limiting** - API protection
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security headers

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/sports-club-registration-system.git
cd sports-club-registration-system
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 4. Database Setup
```bash
# Run the SQL schema file
psql -U your_username -d your_database -f backend/database/schema.sql
```

## 🔧 Environment Variables

### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sports_club_registration
DB_USER=your_username
DB_PASSWORD=your_password
NODE_ENV=development
PORT=3001
JWT_SECRET=your_jwt_secret
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:3001/api
```

## 📱 Application Flow

1. **Step 1**: Basic Information
2. **Step 2**: Club Information & Colors
3. **Step 3**: Player Registration
4. **Step 4**: Document Upload
5. **Step 5**: Review & Submit

## 🗄️ Database Schema

- **teams**: Main application records
- **players**: Player information
- **documents**: File management
- **team_colors**: Club color associations
- **provinces**: Geographic data
- **districts**: Geographic subdivisions
- **colors**: Available color options

## 🖨️ Printer Integration

The system supports Smart 31S card printers for generating player cards:
- USB and Network printer support
- ESC/POS command protocol
- Automatic connection testing
- Batch printing capabilities

## 🔒 Security Features

- Input validation and sanitization
- Rate limiting protection
- CORS configuration
- Security headers (Helmet)
- Environment variable protection
- File upload restrictions

## 📊 API Endpoints

### Applications
- `POST /api/applications` - Create new application
- `GET /api/applications` - List all applications
- `GET /api/applications/:id` - Get application details
- `PATCH /api/applications/:id/status` - Update status
- `DELETE /api/applications/:id` - Delete application

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/:id` - Get documents
- `GET /api/documents/:id/emblem` - Get emblem

### Printer
- `GET /api/printer/status` - Check printer status
- `POST /api/printer/print/team-cards` - Print team cards
- `POST /api/printer/print/test` - Test print

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Domain configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented

### Docker Support
```bash
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Turkish Sports Federation for requirements
- ESC/POS community for printer integration
- React and Node.js communities for excellent documentation

## 📞 Support

For support and questions:
- Create an issue in this repository
- Contact the development team
- Check the documentation

---

**Made with ❤️ for Turkish Sports Community**
