"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const auth_service_1 = require("../services/auth.service");
const faker_1 = require("@faker-js/faker");
const http_status_codes_1 = require("http-status-codes");
const unique_username_generator_1 = require("unique-username-generator");
const uuid_1 = require("uuid");
const lodash_1 = require("lodash");
function generate(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { count } = req.params;
        const usernames = [];
        for (let i = 0; i < parseInt(count, 10); i++) {
            const name = (0, unique_username_generator_1.generateUsername)("", 0, 12);
            usernames.push((0, jobber_shared_1.firstLetterUppercase)(name));
        }
        for (let i = 0; i < usernames.length; i++) {
            const username = usernames[i];
            const email = faker_1.faker.internet.email();
            const password = "jobberuser";
            const country = faker_1.faker.location.country();
            const profilePicture = faker_1.faker.image.urlPicsumPhotos();
            const checkIfUserExist = yield (0, auth_service_1.getUserByUsernameOrEmail)(username, email);
            if (checkIfUserExist) {
                throw new jobber_shared_1.BadRequestError("Invalid credentials. Email or Username", "Seed generate() method error");
            }
            const profilePublicId = (0, uuid_1.v4)();
            const randomBytes = crypto_1.default.randomBytes(20);
            const randomCharacters = randomBytes.toString("hex");
            const authData = {
                username: username,
                email: (0, jobber_shared_1.lowerCase)(email),
                profilePublicId,
                password,
                country,
                profilePicture,
                emailVerificationToken: randomCharacters,
                emailVerified: (0, lodash_1.sample)([0, 1])
            };
            (0, auth_service_1.createAuthUser)(authData);
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Seed users created successfully",
            total: count
        });
    });
}
exports.generate = generate;
//# sourceMappingURL=seeds.js.map