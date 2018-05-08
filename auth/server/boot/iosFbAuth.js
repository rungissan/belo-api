import { genereateTokensForClient } from './../lib/oauth/token-utils'

export default function (app) {
    app.post('/ios-fb-auth', async (req, res) => {
        try{
            const { id, first_name, last_name, email } = req.body.user
            const scheme = 'oAuth 2.0'
            const provider = 'fb_ios'

            const user = await app.models.Client.findOrCreate({
                where: { email }
            }, {
                email, 
                password: `${id} default`,
                username: `${provider}.${id}`
            })

            const identity = await app.models.UserIdentity.findOrCreate({
                where: { externalId: id }
            },{
                externalId: id,
                provider: provider,
                authScheme: scheme,
                created: Date.now(),
                modified: Date.now(),
                profile: req.body.user,
                credentials: req.body.credentials,
                userId: user[0].id
            })

            const account = await app.models.Account.findOrCreate({
                where: { userId: user[0].id }
            },{
                userId: user[0].id,
                firstName: first_name,
                lastName: last_name
            })

            const token = await genereateTokensForClient(app, { 
                user: {
                    id: user[0].id
                },
                clientId: provider,
                scope: ['DEFAULT']
            })
            const result = {
                access_token: token.id,
                expiresIn: token.expiresIn,
                refresh_token: token.refreshToken,
                scope: token.scopes,
                token_type: token.tokenType,
                userId: token.userId
            }
            res.json(result)
        } catch (err) {
            res.json(err)
        }
    });
}