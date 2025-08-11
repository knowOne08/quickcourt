const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((err) => {
            // Log error
            console.error('Error:', err);

            // Check if it's a known operational error
            if (err.isOperational) {
                return res.status(err.statusCode).json({
                    status: err.status,
                    message: err.message
                });
            }

            // For unknown errors, send generic response
            res.status(500).json({
                status: 'error',
                message: 'Something went wrong!'
            });
        });
    };
};

module.exports = catchAsync;
