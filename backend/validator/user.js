const POST = {
    username: {
        in: ['body'],
        isLength: {
            options: {
                min: 3,
                max: 20
            },
            errorMessage: 'Username must be 3-20 characters long'
        }
    },
    display_name: {
        in: ['body'],
        isLength: {
            options: {
                min: 1,
                max: 60
            },
            errorMessage: 'Display name must be 1-60 characters long'
        }
    },
    password: {
        in: ['body'],
        isLength: {
            options: {
                min: 8
            },
            errorMessage: 'Password must be at least 8 characters'
        },
        matches: {
            options: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/],
            errorMessage:
                'Password must include at least one of all the following: uppercase, lowercase letter, number, special character (!@#$%^&*)'
        }
    },
    passwordConfirm: {
        in: ['body'],
        custom: {
            options: (value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Passwords do not match');
                }
                return true;
            }
        }
    }
};

module.exports = { POST };
