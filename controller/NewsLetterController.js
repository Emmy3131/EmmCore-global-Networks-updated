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
      message: "You have successfully subscribed to the newsletter",
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllSubscribers = async (req, res, next) => {
  try {
    const subscribers = await NewsletterModel.find();
    res.status(200).json({
      status: "success",
      data: subscribers,
    });
  } catch (error) {
    next(error);
  }
};
