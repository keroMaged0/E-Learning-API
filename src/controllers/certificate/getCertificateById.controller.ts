import { RequestHandler } from "express";

import { checkEnrolledCourse } from "../enrolledCourse/checkEnrolledCourse.controller";
import { catchError } from "../../middlewares/errorHandling.middleware";
import { Certificate } from "../../models/certificate.models";
import { NotFoundError } from "../../errors/notFoundError";
import { SuccessResponse } from "../../types/response";
import { Users } from "../../models/user.models";
import { SystemRoles } from "../../types/roles";


/**
 * Handler to retrieve a certificate by its ID.
 *
 * This handler retrieves a certificate based on the provided ID, checks if the user
 * exists, and verifies that the user is authorized to access the certificate based 
 * on their role (either as a teacher or a student enrolled in the associated course).
 *
 * @param {Request} req - The request object containing the certificate ID in the route parameters.
 * @param {Response} res - The response object used to send the retrieved certificate.
 * @param {NextFunction} next - The next middleware function to call in case of an error.
 *
 * @returns {Promise<void>} - A promise that resolves to void.
 *
 * @throws {NotFoundError} - Throws an error if the certificate or user is not found.
 */
export const getCertificateByIdHandler: RequestHandler<
    unknown,
    SuccessResponse
> = catchError(
    async (req, res, next) => {
        const { certificateId } = req.params;
        const { _id } = req.loggedUser;

        const certificate = await Certificate.findById(certificateId);
        if (!certificate) return next(new NotFoundError('Certificate not found'));

        const user = await Users.findById(_id);
        if (!user) return next(new NotFoundError('User not found'));

        // Check if instructor is authorized to access the certificate
        if (user.role === SystemRoles.teacher) {
            await checkEnrolledCourse({ courseId: certificate.courseId, userId: _id, next });
        }

        // Check if the user is authorized to access the certificate based on their role
        if (user.role === SystemRoles.student) {
            await checkEnrolledCourse({ courseId: certificate.courseId, userId: user._id, next });
        }

        res.status(200).json({
            status: true,
            message: 'data retrieved successfully',
            data: certificate,
        });

    }
)

