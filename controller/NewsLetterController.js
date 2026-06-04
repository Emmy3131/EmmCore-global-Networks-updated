const NewsletterModel = require("../model/NewsLetterModel");
const AppError = require("../utils/appError");

exports.subscribeNewsletter = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError("Email is required", 400));
    }

    const existingSubscription =
      await NewsletterModel.findOne({ email });

    if (existingSubscription) {
      return next(
        new AppError(
          "This email is already subscribed",
          400
        )
      );
    }

    const newSubscription =
      await NewsletterModel.create({ email });

    res.status(201).json({
      status: "success",
      data: newSubscription,
    });
  } catch (error) {
    next(error);
  }
};