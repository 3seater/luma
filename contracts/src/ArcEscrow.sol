// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Native USDC link escrow for Arc. No admin, upgrades, fees or arbitrary ERC-20 deposits.
contract ArcEscrow is ReentrancyGuard {
    string public constant VERSION = "arc-send-1";
    enum Status { Missing, Pending, Claimed, Cancelled }
    struct Deposit { address sender; address claimSigner; uint256 amount; Status status; uint256 createdAt; }
    uint256 public depositCount;
    mapping(uint256 => Deposit) private deposits;
    event Deposited(uint256 indexed id, address indexed sender, address claimSigner, uint256 amount);
    event Claimed(uint256 indexed id, address indexed recipient, uint256 amount);
    event Cancelled(uint256 indexed id, address indexed sender, uint256 amount);
    error InvalidDeposit(); error InvalidRecipient(); error InvalidSignature();
    error NotPending(); error NotSender(); error TransferFailed();

    function deposit(address claimSigner) external payable returns (uint256 id) {
        if (msg.value == 0 || claimSigner == address(0)) revert InvalidDeposit();
        id = ++depositCount;
        deposits[id] = Deposit(msg.sender, claimSigner, msg.value, Status.Pending, block.timestamp);
        emit Deposited(id, msg.sender, claimSigner, msg.value);
    }
    /// @dev Signatures bind payouts to a recipient, deposit, chain and escrow.
    /// Anyone can relay a signed claim; observing it cannot redirect its funds.
    function claim(uint256 id, address recipient, bytes calldata signature) external nonReentrant {
        Deposit storage item = deposits[id];
        if (item.status != Status.Pending) revert NotPending();
        if (recipient == address(0) || recipient == address(this)) revert InvalidRecipient();
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(keccak256(abi.encode(block.chainid, address(this), id, recipient)));
        if (ECDSA.recover(digest, signature) != item.claimSigner) revert InvalidSignature();
        item.status = Status.Claimed;
        (bool success,) = recipient.call{value: item.amount}("");
        if (!success) revert TransferFailed();
        emit Claimed(id, recipient, item.amount);
    }
    function cancel(uint256 id) external nonReentrant {
        Deposit storage item = deposits[id];
        if (item.status != Status.Pending) revert NotPending();
        if (item.sender != msg.sender) revert NotSender();
        item.status = Status.Cancelled;
        (bool success,) = item.sender.call{value: item.amount}("");
        if (!success) revert TransferFailed();
        emit Cancelled(id, item.sender, item.amount);
    }
    function getDeposit(uint256 id) external view returns (Deposit memory) { return deposits[id]; }
}
