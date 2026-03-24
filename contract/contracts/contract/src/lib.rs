#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Symbol, Map};
#[contract]
pub struct SimpleDEX;
#[contractimpl]
impl SimpleDEX {
    // Store balances: (user -> token -> balance)
    pub fn deposit(env: Env, user: Address, token: Symbol, amount: i128) {
        user.require_auth();

        let mut balances: Map<(Address, Symbol), i128> =
            env.storage().instance().get(&symbol_short!("BAL")).unwrap_or(Map::new(&env));

        let key = (user.clone(), token.clone());
        let current = balances.get(key.clone()).unwrap_or(0);

        balances.set(key, current + amount);
        env.storage().instance().set(&symbol_short!("BAL"), &balances);
    }

    pub fn withdraw(env: Env, user: Address, token: Symbol, amount: i128) {
        user.require_auth();

        let mut balances: Map<(Address, Symbol), i128> =
            env.storage().instance().get(&symbol_short!("BAL")).unwrap();

        let key = (user.clone(), token.clone());
        let current = balances.get(key.clone()).unwrap_or(0);

        if current < amount {
            panic!("Insufficient balance");
        }

        balances.set(key, current - amount);
        env.storage().instance().set(&symbol_short!("BAL"), &balances);
    }

    pub fn swap(
        env: Env,
        user: Address,
        token_in: Symbol,
        token_out: Symbol,
        amount: i128,
        rate: i128,
    ) {
        user.require_auth();

        let mut balances: Map<(Address, Symbol), i128> =
            env.storage().instance().get(&symbol_short!("BAL")).unwrap();

        let in_key = (user.clone(), token_in.clone());
        let out_key = (user.clone(), token_out.clone());

        let in_balance = balances.get(in_key.clone()).unwrap_or(0);

        if in_balance < amount {
            panic!("Insufficient input balance");
        }

        let output_amount = amount * rate;

        let out_balance = balances.get(out_key.clone()).unwrap_or(0);

        balances.set(in_key, in_balance - amount);
        balances.set(out_key, out_balance + output_amount);

        env.storage().instance().set(&symbol_short!("BAL"), &balances);
    }

    pub fn get_balance(env: Env, user: Address, token: Symbol) -> i128 {
        let balances: Map<(Address, Symbol), i128> =
            env.storage().instance().get(&symbol_short!("BAL")).unwrap_or(Map::new(&env));

        balances.get((user, token)).unwrap_or(0)
    }
}