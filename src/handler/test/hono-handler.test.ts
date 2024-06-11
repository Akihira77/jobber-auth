import { setupHono } from "@auth/server"
import { Hono } from "hono"

let app: Hono
describe("Auth Service Integration Testing", () => {
    beforeAll(async () => {
        app = new Hono()
        app = await setupHono(app)
    })

    describe("GET /auth/search/gig with params [/:from/:size/:type] and queries [?query=&delivery_time=&min=&max=]", () => {
        it("Should return 200 OK and gig array of object #1", async () => {
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
            expect(resBody.message).not.toBeNull()
            expect(resBody.total).not.toBeNull()
            expect(resBody.gigs).not.toBeNull()
        })

        it("Should return 200 OK and gig array of object #2", async () => {
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
            expect(resBody.message).not.toBeNull()
            expect(resBody.total).not.toBeNull()
            expect(resBody.gigs).not.toBeNull()
        })
    })

    describe("GET /auth/search/gig with param [/:id]", () => {
        it("Should return 200 OK and a gig object", async () => {
            const id = "664d6353cf0fec9ffb355e66"
            const res = await app.request(`/auth/search/gig/${id}`, {
                method: "GET"
            })

            expect(res.status).toBe(200)
            const resBody = await res.json()
            expect(resBody).not.toBeNull()
            expect(resBody.message).not.toBeNull()
            expect(resBody.gig).not.toBeNull()
        })

        it("Should return 404 Not Found", async () => {
            const id = "wrong-id"
            const res = await app.request(`/auth/search/gig/${id}`, {
                method: "GET"
            })

            expect(res.status).toBe(404)
            const resBody = await res.json()
            expect(resBody.message).not.toBeNull()
            expect(resBody.gig).toEqual({})
        })
    })

    describe("POST /auth/signin", () => {
        it("Should return 200 OK", async () => {
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
            expect(resBody.message).not.toBeNull()
            expect(resBody.user).not.toBeNull()
            expect(resBody.token).not.toBeNull()
        })

        it("Should return 400 Bad Request", async () => {
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
            expect(resBody.message).not.toBeNull()
        })
    })

    describe("GET /auth/refresh-token", () => {
        it("Should return 200 OK", async () => {
            const username = "Properaeropl"
            const res = await app.request(`/auth/refresh-token/${username}`, {
                method: "GET"
            })

            expect(res.status).toBe(200)
            const resBody = await res.json()
            expect(resBody).not.toBeNull()
            expect(resBody.message).not.toBeNull()
            expect(resBody.user).not.toBeNull()
            expect(resBody.token).not.toBeNull()
        })

        it("Should return 404 Not Found", async () => {
            const username = "notfounduser"

            const res = await app.request(`/auth/refresh-token/${username}`, {
                method: "GET"
            })

            expect(res.status).toBe(404)
            const resBody = await res.json()
            expect(resBody).not.toBeNull()
            expect(resBody.message).not.toBeNull()
        })
    })
})
