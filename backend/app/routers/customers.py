from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Customer
from ..schemas import CustomerCreate, CustomerResponse

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("", response_model=List[CustomerResponse])
def get_customers(db: Session = Depends(get_db)):
    # Internal route for worker/admin app interactions
    return db.query(Customer).order_by(Customer.id.asc()).all()

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.post("", response_model=CustomerResponse, status_code=201)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    customer = Customer(
        name=payload.name,
        contact=payload.contact,
        location=payload.location
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer
