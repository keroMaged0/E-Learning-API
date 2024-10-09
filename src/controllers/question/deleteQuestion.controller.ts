import { RequestHandler } from "express";

import { findQuestionById } from "../../services/entities/question.service";
import { sendVerifyCode } from "../../services/entities/verifyCode.service";
import { catchError } from "../../middlewares/errorHandling.middleware";
import { findCourseById } from "../../services/entities/course.service";
import { findQuizById } from "../../services/entities/quiz.service";
import { findUserById } from "../../services/entities/user.service";
import { NotAllowedError } from "../../errors/notAllowedError";
import { VerifyReason } from "../../types/verify-reason";
import { SuccessResponse } from "../../types/response";

/**
 * Handler to delete a question by its ID.
 * 
 * This handler initiates the process of deleting a question by sending
 * a verification code to the user's email for confirmation. The user must
 * be the instructor of the associated course to proceed with the deletion.
 * 
 * @param {Request} req - The request object containing the question ID in the route params.
 * @param {Response} res - The response object used to send a confirmation message.
 * @param {NextFunction} next - The next middleware function to call in case of an error.
 * 
 * @returns {Promise<void>} - A promise that resolves to void.
 * 
 * @throws {NotFoundError} - Throws an error if the question, quiz, course, or user is not found.
 * @throws {NotAllowedError} - Throws an error if the user is not allowed to delete the question.
 */
export const deleteQuestionHandler: RequestHandler<
    unknown,
    SuccessResponse
> = catchError(
    async (req, res, next) => {
        const { questionId } = req.params;
        const { _id } = req.loggedUser;

        // Check if the question exists
        const question = await findQuestionById(questionId, next);

        // Check if the quiz exists
        const quiz = await findQuizById(question.quizId, next);

        // Check if the course exists
        const course = await findCourseById(quiz.courseId, next)

        // Check if the user exists
        const user = await findUserById(_id, next);

        // Check if the user is the instructor of the course
        if (course?.instructorId.toString() !== _id.toString())
            return next(new NotAllowedError('You are not allowed to delete this quiz'));

        // Generate a verification code for deletion confirmation
        const expireAt = await sendVerifyCode({
            user,
            reason: VerifyReason.deleteQuestion,
            subject: `Verification code to delete ${question.questionText} your question`,
        })

        res.status(200).json({
            status: true,
            message: 'Check your email to confirm question deletion',
            data: expireAt,
        });
    }
)