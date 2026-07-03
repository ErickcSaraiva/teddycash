from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import uuid

app = FastAPI(title="Teddycash Backend - Mock")

# Simple in-memory store for prototyping
USERS = {"user1": {"id": "user1", "balance": 1250}}
TRANSACTIONS: List[dict] = []

class TransferRequest(BaseModel):
    user_id: str
    amount: int
    machine_id: str

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/auth/login")
async def login():
    # mock login - returns a static user for now
    return {"access_token": "mock-token", "user_id": "user1"}

@app.get("/balance/{user_id}")
async def get_balance(user_id: str):
    user = USERS.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user_id": user_id, "balance": user["balance"]}

@app.post("/transfer")
async def transfer(req: TransferRequest):
    user = USERS.get(req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")
    if req.amount > user["balance"]:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    # reduce balance and record transaction
    user["balance"] -= req.amount
    tx = {"id": str(uuid.uuid4()), "user_id": req.user_id, "amount": req.amount, "machine_id": req.machine_id}
    TRANSACTIONS.append(tx)
    return {"status": "ok", "tx": tx, "balance": user["balance"]}

@app.get("/transactions/{user_id}")
async def list_transactions(user_id: str):
    return [t for t in TRANSACTIONS if t["user_id"] == user_id]
