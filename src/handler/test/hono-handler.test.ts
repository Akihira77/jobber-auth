import { setupHono } from "@auth/server"
import { Hono } from "hono"

let app: Hono
describe("Auth Service Integration Testing", () => {
    beforeAll(async () => {
        app = new Hono()
        app = await setupHono(app)
    })

    async function jwtTokenFromSignin(
        username: string,
        password: string
    ): Promise<string> {
        const signInData = {
            username: username,
            password: password
        }
        const signInRes = await app.request("/auth/signin", {
            method: "POST",
            headers: new Headers({ "Content-Type": "application/json" }),
            body: JSON.stringify(signInData)
        })
        const token: string = (await signInRes.json()).token
        // console.log(token)
        return token
    }

    describe("GET /auth/search/gig with params [/:from/:size/:type] and queries [?query=&delivery_time=&min=&max=]", () => {
        it("Harus mengembalikan status_code 200 dan array data gig #1 - parameter [150/10/forward] dan query [query=&delivery_time=2&min=0&max=100]", async () => {
            const params = "150/10/forward"
            const queries = "query=&delivery_time=2&min=0&max=100"
            const res = await app.request(
                `/auth/search/gig/${params}?${queries}`,
                {
                    method: "GET"
                }
            )

            expect(res.status).toBe(200)
            const resBody = await res.json()
            expect(resBody).not.toBeNull()
            expect(Object.keys(resBody)).toEqual(["message", "total", "gigs"])
            expect(resBody.message).not.toBeNull()
            expect(resBody.total).not.toBeNull()
            expect(resBody.gigs).not.toBeNull()
        })

        it("Harus mengembalikan status_code 200 dan array data gig #2 - parameter [150/5/backward] dan query [query=&delivery_time=5&min=0&max=100]", async () => {
            const params = "150/5/backward"
            const queries = "query=&delivery_time=5&min=0&max=100"
            const res = await app.request(
                `/auth/search/gig/${params}?${queries}`,
                {
                    method: "GET"
                }
            )

            expect(res.status).toBe(200)
            const resBody = await res.json()
            expect(resBody).not.toBeNull()
            expect(Object.keys(resBody)).toEqual(["message", "total", "gigs"])
            expect(resBody.message).not.toBeNull()
            expect(resBody.total).not.toBeNull()
            expect(resBody.gigs).not.toBeNull()
        })
    })

    describe("GET /auth/search/gig with param [/:id]", () => {
        it("Harus mengembalikan status_code 200 dan single data gig", async () => {
            const id = "664d6353cf0fec9ffb355e66"
            const res = await app.request(`/auth/search/gig/${id}`, {
                method: "GET"
            })

            expect(res.status).toBe(200)
            const resBody = await res.json()
            expect(resBody).not.toBeNull()
            expect(Object.keys(resBody)).toEqual(["message", "gig"])
            expect(resBody.message).not.toBeNull()
            expect(resBody.gig).not.toBeNull()
        })

        it("Harus mengembalikan status_code 404 bahwa data gig tidak ditemukan", async () => {
            const id = "wrong-id"
            const res = await app.request(`/auth/search/gig/${id}`, {
                method: "GET"
            })

            expect(res.status).toBe(404)
            const resBody = await res.json()
            expect(Object.keys(resBody)).toEqual(["message", "gig"])
            expect(resBody.message).not.toBeNull()
            expect(resBody.gig).toEqual({})
        })
    })

    describe("POST /auth/signup", () => {
        it("Harus mengembalikan status_code 400 bahwa data pengguna sudah tersimpan pada database", async () => {
            const reqBody = {
                username: "painfulpillo",
                email: "lila69@yahoo.com",
                password: "jobberuser",
                country: "Afghanistan",
                profilePicture: "https://picsum.photos/seed/cn8Bk/640/480"
            }

            const res = await app.request("/auth/signup", {
                method: "POST",
                body: JSON.stringify(reqBody),
                headers: new Headers({ "Content-Type": "application/json" })
            })

            const resBody = await res.json()
            expect(res.status).toBe(400)
            expect(resBody).not.toBeNull()
            expect(Object.keys(resBody)).toEqual([
                "message",
                "statusCode",
                "status",
                "comingFrom"
            ])
            expect(resBody.message).not.toBeNull()
        })
    })

    describe("POST /auth/signin", () => {
        it("Harus mengembalikan status_code 200 dan data pengguna serta token JWT", async () => {
            const reqBody = {
                username: "lila69@yahoo.com",
                password: "jobberuser"
            }

            const res = await app.request("/auth/signin", {
                method: "POST",
                body: JSON.stringify(reqBody),
                headers: new Headers({ "Content-Type": "application/json" })
            })

            expect(res.status).toBe(200)
            const resBody = await res.json()
            expect(resBody).not.toBeNull()
            expect(Object.keys(resBody)).toEqual(["message", "user", "token"])
            expect(resBody.message).not.toBeNull()
            expect(resBody.user).not.toBeNull()
            expect(resBody.token).not.toBeNull()
        })

        it("Harus mengembalikan status_code 400 bahwa data pengguna tidak ditemukan", async () => {
            const reqBody = {
                username: "notfounduser@mail.com",
                password: "jobberuser"
            }

            const res = await app.request("/auth/signin", {
                method: "POST",
                body: JSON.stringify(reqBody),
                headers: new Headers({ "Content-Type": "application/json" })
            })

            expect(res.status).toBe(400)
            const resBody = await res.json()
            expect(resBody).not.toBeNull()
            expect(Object.keys(resBody)).toEqual([
                "message",
                "statusCode",
                "status",
                "comingFrom"
            ])
            expect(resBody.message).not.toBeNull()
        })
    })

    describe("PUT /auth/verify-email", () => {
        it("Harus mengembalikan status_code 400 bahwa mungkin token sudah tidak valid atau sudah digunakan sebelumnya", async () => {
            const token = "invalid-token"
            const res = await app.request("/auth/verify-email", {
                method: "PUT",
                headers: new Headers({ "Content-Type": "application/json" }),
                body: JSON.stringify({ token })
            })

            expect(res.status).toBe(400)
            const resBody = await res.json()

            expect(resBody).not.toBeNull()
            expect(Object.keys(resBody)).toEqual([
                "message",
                "statusCode",
                "status",
                "comingFrom"
            ])
            expect(resBody.message).not.toBeNull()
            expect(resBody.message).toBe(
                "Verification token is either invalid or already used."
            )
        })
    })

    describe("GET /auth/current-user", () => {
        it("Harus mengembalikan status_code 200 dan data pengguna yang telah ter-autentikasi", async () => {
            const token = await jwtTokenFromSignin("properaeropl", "jobberuser")
            const res = await app.request("/auth/current-user", {
                method: "GET",
                headers: new Headers({ Authorization: `Bearer ${token}` })
            })

            const resBody = await res.json()
            expect(res.status).toBe(200)
            expect(resBody).not.toBeNull()
            expect(Object.keys(resBody)).toEqual(["message", "user"])
            expect(resBody.message).not.toBeNull()
            expect(resBody.user).not.toBeNull()
        })

        it("Harus mengembalikan status_code 401 bahwa pengguna tidak ter-autentikasi", async () => {
            const res = await app.request("/auth/current-user", {
                method: "GET"
            })

            const resBody = await res.json()
            expect(res.status).toBe(401)
            expect(resBody).not.toBeNull()
            expect(Object.keys(resBody)).toEqual([
                "message",
                "statusCode",
                "status",
                "comingFrom"
            ])
            expect(resBody.message).not.toBeNull()
            expect(resBody.message).toBe(
                "User is not authenticated. Please signin first."
            )
        })
    })

    describe("GET /auth/refresh-token", () => {
        it("Harus mengembalikan status_code 200 dan data pengguna serta token JWT", async () => {
            const token = await jwtTokenFromSignin("properaeropl", "jobberuser")
            const username = "Properaeropl"
            const res = await app.request(`/auth/refresh-token/${username}`, {
                method: "GET",
                headers: new Headers({ Authorization: `Bearer ${token}` })
            })

            expect(res.status).toBe(200)
            const resBody = await res.json()
            expect(resBody).not.toBeNull()
            expect(Object.keys(resBody)).toEqual(["message", "user", "token"])
            expect(resBody.message).not.toBeNull()
            expect(resBody.user).not.toBeNull()
            expect(resBody.token).not.toBeNull()
        })

        it("Harus mengembalikan status_code 401 bahwa pengguna tidak ter-autentikasi", async () => {
            const res = await app.request("/auth/current-user", {
                method: "GET"
            })

            const resBody = await res.json()
            expect(res.status).toBe(401)
            expect(resBody).not.toBeNull()
            expect(Object.keys(resBody)).toEqual([
                "message",
                "statusCode",
                "status",
                "comingFrom"
            ])
            expect(resBody.message).not.toBeNull()
            expect(resBody.message).toBe(
                "User is not authenticated. Please signin first."
            )
        })
    })
})
