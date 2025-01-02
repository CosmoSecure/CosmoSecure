# CosmoSecure Desktop App

Welcome to the official repository of the CosmoSecure Desktop App, a robust and secure password manager designed to keep your credentials safe and easily accessible. This application is built using Tauri, Rust, and React, ensuring top-notch performance and security.

## 🚀 Features

- 🔐 **Secure Storage**: State-of-the-art AES encryption to protect your passwords.
- 🗂️ **Password Management**: Effortlessly add, edit, delete, and view stored passwords.
- 💻 **Cross-Platform**: Compatible with Windows and Linux.
- 🖼️ **User-Friendly Interface**: A clean, intuitive design for seamless navigation.
- 🚀 **Lightweight and Fast**: Built with Tauri for high performance and minimal resource usage.

## 🛠️ Getting Started

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

2. **Install dependencies**:
    ```sh
    npm install
    ```

3. **Build the Tauri application**:
    ```sh
    npm run tauri build
    ```

4. **Run the application**:
    ```sh
    npm run tauri dev
    ```

## Usage

### Adding a Password

1. Open the CosmoSecure Desktop App.
2. Navigate to the "Vault" section.
3. Enter the account name, username, and password.
4. Click "Add" to save the password.

### Updating a Password

1. In the "Vault" section, find the password entry you want to update.
2. Click "Edit" next to the entry.
3. Modify the account name, username, or password as needed.
4. Click "Update" to save the changes.

### Deleting a Password

1. In the "Vault" section, find the password entry you want to delete.
2. Click "Delete" next to the entry.
3. Confirm the deletion.

## Security

CosmoSecure uses AES encryption to securely store your passwords. Your data is encrypted locally on your device, ensuring that only you have access to your credentials.

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

---

Thank you for using **CosmoSecure**! We hope it helps you manage your passwords securely and efficiently.