import { VC } from '@learncard/types';
import { PayloadHandler } from 'payload/config';
import payload from 'payload';
import jwt from 'jsonwebtoken';

const secret =
    process.env.PAYLOAD_SECRET ??
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabaaaaaaaaaaaaaaaaaaaa';

export const forwardExchangeRequest: PayloadHandler = async (req, res) => {
    const { a, b, token } = req.params;
    let id: string;

    try {
        const decoded = jwt.verify(token, secret);

        if (typeof decoded === 'string' || !decoded.id) return res.sendStatus(401);

        id = decoded.id;
    } catch (error) {
        return res.sendStatus(401);
    }

    const response = await fetch(`http://localhost:4005/exchange/${a}/${b}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(req.body),
    });

    if (response.status !== 200) return res.sendStatus(response.status);
    const credential = (await response.json()) as VC;

    if (credential?.credentialStatus?.id) {
        await payload.update({
            collection: 'credential',
            id,
            data: { statusListId: credential.credentialStatus.id },
        });
    }

    return res.json(credential);
};
