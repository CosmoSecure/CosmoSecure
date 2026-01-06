# CosmoSecure Desktop App

Welcome to the official repository of the CosmoSecure Desktop App, a robust and secure password manager designed to keep your credentials safe and easily accessible. This application is built using Tauri, Rust, and React, ensuring top-notch performance and security.

## Features

- **Zero-Knowledge Proof Authentication**: Master password verification using zero knowledge authentication, ensuring your credentials never leave your device
- **Secure Password Vault**: AES-256 encryption for storing and managing passwords with MongoDB integration
- **Password Generator**: Built-in tool for creating strong, random passwords
- **Email Breach Detection**: Monitor and check if your email has been compromised in data breaches
- **Dashboard Analytics**: Visual overview of your security status and password health
- **Cross-Platform Support**: Native desktop application for Windows and Linux
- **Theme Customization**: Dark and light theme support with custom styling
- **Auto-Update System**: Built-in update notifications and management
- **Session Management**: Secure timeout and token-based authentication
- **Modern UI/UX**: React-based interface with Tailwind CSS styling

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri v2.0](https://v2.tauri.app/)

### Installation

1. **Clone the repository**:
    ```sh
    git clone https://github.com/CosmoSecure/CosmoSecure.git
    cd CosmoSecure
    ```

2. **Set up environment variables**:
    - Create a `.env` file in the root directory
    - Configure MongoDB connection string and other required variables
    - See `ENVIRONMENT_VARIABLES_REQUIREMENTS.md` for details

3. **Install dependencies**:
    ```sh
    npm install
    ```

4. **Run the development server**:
    ```sh
    npm run tauri dev
    ```

5. **Build for production**:
    ```sh
    npm run tauri build
    ```

## Usage

### First Time Setup

1. Launch CosmoSecure Desktop App
2. Create a master password (secured with Zero-Knowledge Proof)
3. Complete the authentication setup

### Managing Passwords

**Adding a Password**
1. Navigate to the "Vault" section
2. Click "Add New Password"
3. Enter account details (platform, username, password)
4. Save to encrypted storage

**Editing a Password**
1. Locate the password entry in your Vault
2. Click "Edit" on the entry
3. Update the required fields
4. Save changes

**Deleting a Password**
1. Select the password entry to delete
2. Click "Delete" and confirm the action

### Additional Features

**Password Generator**
- Access from the Tools section
- Customize password length and character types
- Generate strong, random passwords instantly

**Email Breach Check**
- Enter your email address in the Dashboard
- Check if your email appears in known data breaches
- Get notified about security risks

**Settings & Customization**
- Configure theme preferences (light/dark mode)
- Manage session timeout settings
- Update master password when needed

## Security

CosmoSecure implements multiple layers of security to protect your data:

- **Zero-Knowledge Authentication**: Master password authentication without storing the actual password
- **AES-256 Encryption**: Industry-standard encryption for password storage
- **Local Data Encryption**: All sensitive data is encrypted on your device before transmission
- **Secure Token Management**: Session tokens with automatic timeout for enhanced security
- **MongoDB Integration**: Secure database connection with encrypted credentials
- **No Plain-Text Storage**: Passwords are never stored in plain text

For more details, see the security documentation in the `docs/` directory.

## Contributing

We welcome contributions from the community! To contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Open a pull request.

## License

This project is licensed under the **Apache License**. See the [LICENSE](LICENSE) file for details.

## Contact

For any questions or support, please open an issue in this repository or contact us at [aakashsoni8781@gmail.com](mailto:aakashsoni8781@gmail.com).

## Architecture

**Frontend**: React + TypeScript + Tailwind CSS
**Backend**: Rust + Tauri v2.0
**Database**: MongoDB
**Cryptography**: Custom zero knowledge authentication implementation + AES-256

For detailed architecture information, refer to `docs/architecture_plan.md`.

---

Thank you for using **CosmoSecure**. We are committed to providing secure and efficient password management.