import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import List "mo:core/List";
import Nat "mo:core/Nat";

actor {
  type ItemType = {
    #movie;
    #tv;
  };

  type WatchlistItem = {
    id : Nat;
    itemType : ItemType;
  };

  module WatchlistItem {
    public func compare(item1 : WatchlistItem, item2 : WatchlistItem) : Order.Order {
      switch (Nat.compare(item1.id, item2.id)) {
        case (#equal) { compareItemType(item1.itemType, item2.itemType) };
        case (order) { order };
      };
    };
  };

  func compareItemType(type1 : ItemType, type2 : ItemType) : Order.Order {
    switch (type1, type2) {
      case (#movie, #tv) { #less };
      case (#tv, #movie) { #greater };
      case (_, _) { #equal };
    };
  };

  type Watchlist = List.List<WatchlistItem>;
  type UserId = Principal;

  let watchlists = Map.empty<UserId, Watchlist>();

  public shared ({ caller }) func toggleItem(id : Nat, itemType : ItemType) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous users cannot modify watchlist") };

    let newItem : WatchlistItem = { id; itemType };
    let updatedList = getFilteredWatchlist(caller, newItem);

    if (updatedList.isEmpty()) {
      addItem(caller, newItem);
    } else {
      watchlists.add(caller, updatedList);
    };
  };

  func addItem(user : UserId, newItem : WatchlistItem) {
    let currentList = switch (watchlists.get(user)) {
      case (null) {
        let newList = List.empty<WatchlistItem>();
        watchlists.add(user, newList);
        newList;
      };
      case (?list) { list };
    };
    currentList.add(newItem);
  };

  func getFilteredWatchlist(user : UserId, item : WatchlistItem) : Watchlist {
    switch (watchlists.get(user)) {
      case (null) { List.empty() };
      case (?list) { list.filter(func(x) { not isEqual(x, item) }) };
    };
  };

  func isEqual(item1 : WatchlistItem, item2 : WatchlistItem) : Bool {
    item1.id == item2.id and compareItemType(item1.itemType, item2.itemType) == #equal;
  };

  public query ({ caller }) func getWatchlist() : async [WatchlistItem] {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous users do not have a watchlist") };
    switch (watchlists.get(caller)) {
      case (null) { [] };
      case (?watchlist) { watchlist.toArray().sort() };
    };
  };
};
