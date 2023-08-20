const stripe = require("../../../../server/payments/stripe");
const usuarioModel = require("../../../models/Usuario");
const jwt = require("jsonwebtoken");

class PagamentoAssinaturaController {
	async createCustomerSubscription(req, res) {
		try {
			const token = req.session.token;
			const { userId } = jwt.decode(token, process.env.SECRET);
			const user = await usuarioModel.findUserById(userId);
            const product = req.body.product;
            let productSelected = "price_1NemYBEclZEWH4rDy38nZKJ3";

            // switch(product) {
            //     case "anual":
            //         productSelected = "price_1NdNjrEclZEWH4rDiOJt5aG3";
            //     break;

            //     case "teste":
            //         productSelected = "price_1NdNjrEclZEWH4rDiOJt5aG3";
            //     break;

            //     default:
            //         productSelected = "price_1NSmmlEclZEWH4rDH0sovCIa";
            // }

			const customer = await stripe.customers.create({
				email: user.email,
			});

			const subscription = await stripe.subscriptions.create({
				customer: customer.id,
				items: [
					{
						price: productSelected
					},
				],
                trial_period_days: 1,
				payment_behavior: "default_incomplete",
				expand: ["latest_invoice.payment_intent", "pending_setup_intent"],
			});

            // client secret: pi_3NgzdiEclZEWH4rD0CFo7nut_secret_jpONczRVLvjt6GUytQe7qIArP

			usuarioModel.uppdateUserCustomerId(userId, customer.id);

            console.log(subscription);
            console.log(subscription.pending_setup_intent);

			return res.send({
                clientSecret: subscription.latest_invoice.payment_intent.client_secret
            });
		} catch (erro) {
			console.log(erro);
			return res.send({ erro });
		}
	}
}

const PagamentoAssinaturaControllerCreate = new PagamentoAssinaturaController();

module.exports = PagamentoAssinaturaControllerCreate;
