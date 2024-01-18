# L'apprentis DEV

This project is a web application built using Node.js, Express.js, and MySQL. It provides a platform for users to learn and practice web development with HTML, CSS, and JavaScript.

## Features

- User authentication: Users can register, login, and logout.
- Real-time chat: Users can send and receive messages in real-time.
- Code execution: Users can safely execute JavaScript code.
- Learning resources: Users can access various learning resources including courses, exercises, and projects.

## Project Structure

- `app.js`: The main application file. It sets up the Express application, middleware, routes, error handling, and the server.
- `db.js`: Sets up the connection to the MySQL database.
- `routes/`: Contains the route handlers for the application.
  - `index.js`: Handles the main routes of the application.
  - `users.js`: Handles the user-related routes.
- `views/`: Contains the EJS view templates for the application.
  - `auth/`: Contains the view templates for authentication (login and register).
  - `partials/`: Contains the partial view templates (header and footer).
  - `ressource/`: Contains the view templates for the learning resources.
  - `settings/`: Contains the view templates for user settings.
- `public/`: Contains the static files for the application (CSS files).

## Setup

1. Clone the repository.
2. Install the dependencies with `npm install`.
3. Set up a MySQL database and update the connection details in `db.js`.
4. Start the server with `npm start`.

## Dependencies

- [express](https://www.npmjs.com/package/express): Fast, unopinionated, minimalist web framework for Node.js.
- [mysql2](https://www.npmjs.com/package/mysql2): MySQL client for Node.js with focus on performance.
- [socket.io](https://www.npmjs.com/package/socket.io): Enables real-time, bidirectional and event-based communication.
- [cors](https://www.npmjs.com/package/cors): Middleware that can be used to enable CORS with various options.
- [http-errors](https://www.npmjs.com/package/http-errors): Create HTTP error objects.
- [express-session](https://www.npmjs.com/package/express-session): Simple session middleware for Express.
- [cookie-parser](https://www.npmjs.com/package/cookie-parser): Parse Cookie header and populate `req.cookies` with an object keyed by the cookie names.
- [morgan](https://www.npmjs.com/package/morgan): HTTP request logger middleware for Node.js.
- [vm2](https://www.npmjs.com/package/vm2): Sandbox that can run untrusted code with whitelisted Node's built-in modules.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
