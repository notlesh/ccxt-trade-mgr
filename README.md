# ccxt-trade-mgr
Trade Manager for CCXT

The goal of this project is to provide a trade manager for CCXT. This means a few things:

* Add an entry form for entering a position, which includes enrtry point, stop loss, and take profit levels
* Ability to monitor price activity and create/cancel orders which are mutually exclusive (e.g. take profit vs. stop loss)
* Provide ability to record trading rationale, track progress, etc. (e.g. provide a trading journal)
* Allow fake trading for practice, with realistic (or at least pessimistic) order execution 

There is currently no goal of turning this into a trading bot, even though it will support some automated order management.
