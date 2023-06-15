const prisma = require("../../server/database/prismaClient");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

class FormValidation {
    constructor() {
        this.loginValidation = this.loginValidation.bind(this);
    }

    cadastroValidation(req, res, next) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            const {
                nome,
                email,
                data_nascimento,
                senha
            } = req.body;

            const nome_error = errors.errors.find(error => error.path === "nome");
            const email_error = errors.errors.find(error => error.path === "email");
            const data_nascimento_error = errors.errors.find(error => error.path === "data_nascimento");
            const senha_error = errors.errors.find(error => error.path === "senha");

            return res.render("pages/cadastro.ejs", {
                data: {
                    page_name: "Cadastro",
                    input_values: {
                        nome,
                        email,
                        data_nascimento,
                        senha
                    },
                    errors: {
                        nome_error,
                        email_error,
                        data_nascimento_error,
                        senha_error
                    }
                }
            });
        }

        return next();
    }

    async loginValidation(req, res, next) {
        const {
            email,
            senha
        } = req.body;

        const user = await this.#getUser(email);

        if (!user) {
            return res.render("pages/login.ejs", {
                data: {
                    input_values: {
                        email,
                        senha
                    },
                    errors: {
                        email_error: {
                            msg: "Usuário não encontrado"
                        }
                    }
                }
            });
        }

        bcrypt.compare(senha, user.senha).then(auth => {
            if (auth) {
                const token = jwt.sign({ userId: user.id }, process.env.SECRET);

                req.session.token = token;

                const premium = user.premium;

                req.session.premium = premium;

                return next();
            }

            return res.render("pages/login.ejs", {
                data: {
                    input_values: {
                        email,
                        senha
                    },
                    errors: {
                        senha_error: {
                            msg: "Senha incorreta"
                        }
                    }
                }
            })
        })
        .catch(erro => {
            console.log(erro);
            return res.render("pages/login.ejs", {
                data: {
                    input_values: {
                        email,
                        senha
                    },
                    errors: {
                        sistema_error: {
                            msg: "Erro de sistema, tente novamente mais tarde!"
                        }
                    }
                }
            });
        })
    }

    async #getUser(email) {
        const user = await prisma.usuario.findUnique({
            where: {
                email
            }
        })

        return user;
    }
}

const FormValidationMiddleware = new FormValidation();

module.exports = FormValidationMiddleware;